// LEGAL NOTICE: This module handles reputation and risk data.
// Before production deployment, it MUST undergo legal review
// for compliance with personal data protection laws and local regulations.
// Cross-organization reputation signals should expose MINIMAL data.

import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import {
  Warning,
  WarningDocument,
  WarningSeverity,
} from './schemas/warning.schema';
import { Client, ClientDocument, RiskStatus } from '../clients/schemas/client.schema';
import { CreateWarningDto } from './dto/create-warning.dto';

@Injectable()
export class ReputationService {
  private readonly logger = new Logger(ReputationService.name);

  constructor(
    @InjectModel(Warning.name) private readonly warningModel: Model<WarningDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
  ) {}

  async addWarning(
    orgId: string,
    dto: CreateWarningDto,
    userId: string,
  ): Promise<WarningDocument> {
    if (!Types.ObjectId.isValid(dto.clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel
      .findOne({
        _id: new Types.ObjectId(dto.clientId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (!client) {
      throw new NotFoundException(`Client with ID "${dto.clientId}" not found`);
    }

    const warning = new this.warningModel({
      organizationId: new Types.ObjectId(orgId),
      clientId: new Types.ObjectId(dto.clientId),
      type: dto.type,
      severity: dto.severity,
      description: dto.description,
      evidence: dto.evidence || null,
      issuedBy: new Types.ObjectId(userId),
      isActive: true,
    });

    const savedWarning = await warning.save();

    // Increment warningsCount on the client
    await this.clientModel
      .findByIdAndUpdate(dto.clientId, { $inc: { warningsCount: 1 } })
      .exec();

    // Recalculate risk status
    const newRiskStatus = await this.calculateRiskStatus(dto.clientId);
    await this.clientModel
      .findByIdAndUpdate(dto.clientId, { $set: { riskStatus: newRiskStatus } })
      .exec();

    this.logger.log(
      `Warning added for client ${dto.clientId} by user ${userId}: type=${dto.type}, severity=${dto.severity}`,
    );

    return savedWarning;
  }

  async findWarnings(
    orgId: string,
    clientId: string,
  ): Promise<WarningDocument[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    return this.warningModel
      .find({
        organizationId: new Types.ObjectId(orgId),
        clientId: new Types.ObjectId(clientId),
      })
      .populate('issuedBy', 'firstName lastName email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAllWarnings(
    orgId: string,
    query: {
      page?: number;
      limit?: number;
      type?: string;
      severity?: string;
      isActive?: boolean;
      clientId?: string;
    },
  ): Promise<{ data: WarningDocument[]; total: number; page: number; limit: number }> {
    const filter: FilterQuery<WarningDocument> = {
      organizationId: new Types.ObjectId(orgId),
    };

    if (query.type) {
      filter.type = query.type;
    }

    if (query.severity) {
      filter.severity = query.severity;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive;
    }

    if (query.clientId && Types.ObjectId.isValid(query.clientId)) {
      filter.clientId = new Types.ObjectId(query.clientId);
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.warningModel
        .find(filter)
        .populate('clientId', 'firstName lastName phone')
        .populate('issuedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.warningModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async deactivateWarning(
    orgId: string,
    warningId: string,
    userId: string,
  ): Promise<WarningDocument> {
    if (!Types.ObjectId.isValid(warningId)) {
      throw new BadRequestException('Invalid warning ID');
    }

    const warning = await this.warningModel
      .findOne({
        _id: new Types.ObjectId(warningId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (!warning) {
      throw new NotFoundException(`Warning with ID "${warningId}" not found`);
    }

    if (!warning.isActive) {
      throw new BadRequestException('Warning is already deactivated');
    }

    warning.isActive = false;
    await warning.save();

    // Decrement warningsCount on the client (do not go below 0)
    await this.clientModel
      .findByIdAndUpdate(warning.clientId, {
        $inc: { warningsCount: -1 },
      })
      .exec();

    // Ensure warningsCount does not go below 0
    await this.clientModel
      .updateOne(
        { _id: warning.clientId, warningsCount: { $lt: 0 } },
        { $set: { warningsCount: 0 } },
      )
      .exec();

    // Recalculate risk status
    const newRiskStatus = await this.calculateRiskStatus(
      warning.clientId.toString(),
    );
    await this.clientModel
      .findByIdAndUpdate(warning.clientId, { $set: { riskStatus: newRiskStatus } })
      .exec();

    this.logger.log(
      `Warning ${warningId} deactivated by user ${userId}`,
    );

    return warning;
  }

  async getClientReputationSummary(
    orgId: string,
    clientId: string,
  ): Promise<{
    warningsCount: number;
    activeWarnings: number;
    riskStatus: RiskStatus;
    isBlacklisted: boolean;
  }> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel
      .findOne({
        _id: new Types.ObjectId(clientId),
        organizationId: new Types.ObjectId(orgId),
      })
      .exec();

    if (!client) {
      throw new NotFoundException(`Client with ID "${clientId}" not found`);
    }

    const activeWarnings = await this.warningModel.countDocuments({
      organizationId: new Types.ObjectId(orgId),
      clientId: new Types.ObjectId(clientId),
      isActive: true,
    }).exec();

    return {
      warningsCount: client.warningsCount,
      activeWarnings,
      riskStatus: client.riskStatus,
      isBlacklisted: client.isBlacklisted,
    };
  }

  /**
   * Calculate risk status based on active warnings count and severity.
   * Rules:
   *  - 0 active warnings = low
   *  - 1-2 info-only warnings = medium
   *  - any warning-severity warning = high
   *  - any critical-severity warning OR 3+ active warnings = critical
   */
  async calculateRiskStatus(clientId: string): Promise<RiskStatus> {
    const activeWarnings = await this.warningModel
      .find({
        clientId: new Types.ObjectId(clientId),
        isActive: true,
      })
      .exec();

    if (activeWarnings.length === 0) {
      return RiskStatus.LOW;
    }

    const hasCritical = activeWarnings.some(
      (w) => w.severity === WarningSeverity.CRITICAL,
    );
    const hasWarning = activeWarnings.some(
      (w) => w.severity === WarningSeverity.WARNING,
    );

    // Any critical severity or 3+ active warnings => critical
    if (hasCritical || activeWarnings.length >= 3) {
      return RiskStatus.CRITICAL;
    }

    // Any warning-level severity => high
    if (hasWarning) {
      return RiskStatus.HIGH;
    }

    // 1-2 info-only warnings => medium
    return RiskStatus.MEDIUM;
  }
}
