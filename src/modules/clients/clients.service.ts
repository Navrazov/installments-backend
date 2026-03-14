import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery } from 'mongoose';
import { Client, ClientDocument, RiskStatus } from './schemas/client.schema';
import { Deal, DealDocument } from '../deals/schemas/deal.schema';
import { Payment, PaymentDocument } from '../payments/schemas/payment.schema';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { encrypt, decrypt } from '../../common/utils/encryption';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ClientsService {
  private readonly logger = new Logger(ClientsService.name);

  constructor(
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Deal.name) private readonly dealModel: Model<DealDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
  ) {}

  async create(
    orgId: Types.ObjectId,
    dto: CreateClientDto,
    userId: Types.ObjectId,
  ): Promise<ClientDocument> {
    const data: any = {
      ...dto,
      organizationId: orgId,
      createdBy: userId,
    };

    if (dto.passport) {
      data.passport = this.encryptPassport(dto.passport);
    }

    const client = new this.clientModel(data);
    const saved = await client.save();
    return this.decryptClientPassport(saved.toObject());
  }

  async findAll(
    orgId: Types.ObjectId,
    query: QueryClientDto,
  ): Promise<PaginatedResponse<ClientDocument>> {
    const {
      page = 1,
      limit = 20,
      search,
      riskStatus,
      tags,
      isBlacklisted,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;

    const filter: FilterQuery<ClientDocument> = {
      organizationId: orgId,
    };

    if (search) {
      const searchRegex = new RegExp(
        search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        'i',
      );
      filter.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { phone: searchRegex },
        { middleName: searchRegex },
      ];
    }

    if (riskStatus) {
      filter.riskStatus = riskStatus;
    }

    if (tags && tags.length > 0) {
      filter.tags = { $all: tags };
    }

    if (isBlacklisted !== undefined) {
      filter.isBlacklisted = isBlacklisted;
    }

    if (query.isGuarantor !== undefined) {
      filter.isGuarantor = query.isGuarantor;
    }

    const sort: Record<string, 1 | -1> = {
      [sortBy]: sortOrder === 'asc' ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.clientModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.clientModel.countDocuments(filter).exec(),
    ]);

    const decryptedData = data.map((client) =>
      this.decryptClientPassport(client),
    );

    return {
      data: decryptedData as ClientDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    orgId: Types.ObjectId,
    clientId: string,
  ): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel
      .findOne({
        _id: new Types.ObjectId(clientId),
        organizationId: orgId,
      })
      .lean()
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.decryptClientPassport(client) as ClientDocument;
  }

  async update(
    orgId: Types.ObjectId,
    clientId: string,
    dto: UpdateClientDto,
    userId: Types.ObjectId,
  ): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const updateData: any = { ...dto };

    if ((dto as any).passport) {
      updateData.passport = this.encryptPassport((dto as any).passport);
    }

    const client = await this.clientModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(clientId),
          organizationId: orgId,
        },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.decryptClientPassport(client) as ClientDocument;
  }

  async addToBlacklist(
    orgId: Types.ObjectId,
    clientId: string,
    userId: Types.ObjectId,
  ): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(clientId),
          organizationId: orgId,
        },
        {
          $set: {
            isBlacklisted: true,
            riskStatus: RiskStatus.BLACKLISTED,
          },
        },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.decryptClientPassport(client) as ClientDocument;
  }

  async removeFromBlacklist(
    orgId: Types.ObjectId,
    clientId: string,
    userId: Types.ObjectId,
  ): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const client = await this.clientModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(clientId),
          organizationId: orgId,
        },
        {
          $set: {
            isBlacklisted: false,
            riskStatus: RiskStatus.MEDIUM,
          },
        },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.decryptClientPassport(client) as ClientDocument;
  }

  async updateRiskStatus(
    orgId: Types.ObjectId,
    clientId: string,
    status: RiskStatus,
    userId: Types.ObjectId,
  ): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const updateData: any = { riskStatus: status };

    if (status === RiskStatus.BLACKLISTED) {
      updateData.isBlacklisted = true;
    }

    const client = await this.clientModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(clientId),
          organizationId: orgId,
        },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    return this.decryptClientPassport(client) as ClientDocument;
  }

  async getClientHistory(
    orgId: Types.ObjectId,
    clientId: string,
  ): Promise<{
    client: ClientDocument;
    deals: DealDocument[];
    payments: PaymentDocument[];
    summary: {
      totalDeals: number;
      activeDeals: number;
      totalPayments: number;
      totalPaid: number;
      totalRemaining: number;
    };
  }> {
    const client = await this.findById(orgId, clientId);
    const clientObjId = new Types.ObjectId(clientId);

    const [deals, payments] = await Promise.all([
      this.dealModel
        .find({
          organizationId: orgId,
          clientId: clientObjId,
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
      this.paymentModel
        .find({
          organizationId: orgId,
          clientId: clientObjId,
        })
        .sort({ createdAt: -1 })
        .lean()
        .exec(),
    ]);

    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    const activeDeals = deals.filter((d) => d.status === 'active');
    const totalRemaining = activeDeals.reduce(
      (sum, d) => sum + d.remainingAmount,
      0,
    );

    return {
      client,
      deals: deals as unknown as DealDocument[],
      payments: payments as unknown as PaymentDocument[],
      summary: {
        totalDeals: deals.length,
        activeDeals: activeDeals.length,
        totalPayments: payments.length,
        totalPaid,
        totalRemaining,
      },
    };
  }

  async search(
    orgId: Types.ObjectId,
    query: string,
  ): Promise<ClientDocument[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const searchRegex = new RegExp(
      query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
      'i',
    );

    const clients = await this.clientModel
      .find({
        organizationId: orgId,
        $or: [
          { firstName: searchRegex },
          { lastName: searchRegex },
          { middleName: searchRegex },
          { phone: searchRegex },
          { address: searchRegex },
          { city: searchRegex },
          { region: searchRegex },
          { actualAddress: searchRegex },
        ],
      })
      .limit(20)
      .lean()
      .exec();

    return clients.map((c) =>
      this.decryptClientPassport(c),
    ) as ClientDocument[];
  }

  async getGuarantorsForClient(orgId: Types.ObjectId, clientId: string): Promise<ClientDocument[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const clients = await this.clientModel
      .find({
        organizationId: orgId,
        'guarantorFor.clientId': new Types.ObjectId(clientId),
      })
      .lean()
      .exec();

    return clients.map(c => this.decryptClientPassport(c) as ClientDocument);
  }

  async addGuarantor(orgId: Types.ObjectId, clientId: string, guarantorId: string, relationship: string): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(guarantorId)) {
      throw new BadRequestException('Invalid client or guarantor ID');
    }

    await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(guarantorId), organizationId: orgId },
      {
        $set: { isGuarantor: true },
        $addToSet: { guarantorFor: { clientId: new Types.ObjectId(clientId), relationship } },
      },
    ).exec();

    return this.findById(orgId, clientId);
  }

  async removeGuarantor(orgId: Types.ObjectId, clientId: string, guarantorId: string): Promise<ClientDocument> {
    if (!Types.ObjectId.isValid(clientId) || !Types.ObjectId.isValid(guarantorId)) {
      throw new BadRequestException('Invalid client or guarantor ID');
    }

    const guarantor = await this.clientModel.findOneAndUpdate(
      { _id: new Types.ObjectId(guarantorId), organizationId: orgId },
      { $pull: { guarantorFor: { clientId: new Types.ObjectId(clientId) } } },
      { new: true },
    ).lean().exec();

    // If guarantor has no more links, unmark isGuarantor
    if (guarantor && (!guarantor.guarantorFor || guarantor.guarantorFor.length === 0)) {
      await this.clientModel.findByIdAndUpdate(guarantorId, { $set: { isGuarantor: false } }).exec();
    }

    return this.findById(orgId, clientId);
  }

  async importClients(
    orgId: Types.ObjectId,
    dtos: CreateClientDto[],
    userId: Types.ObjectId,
  ): Promise<{ imported: number; errors: { row: number; error: string }[] }> {
    const results = { imported: 0, errors: [] as { row: number; error: string }[] };

    for (let i = 0; i < dtos.length; i++) {
      try {
        await this.create(orgId, dtos[i], userId);
        results.imported++;
      } catch (error) {
        results.errors.push({ row: i + 1, error: error.message || 'Unknown error' });
      }
    }

    return results;
  }

  async exportClients(orgId: Types.ObjectId): Promise<ClientDocument[]> {
    const clients = await this.clientModel
      .find({ organizationId: orgId })
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();
    return clients.map(c => this.decryptClientPassport(c)) as ClientDocument[];
  }

  private encryptPassport(passport: any): any {
    const encrypted: any = {};

    if (passport.series) {
      encrypted.series = encrypt(passport.series);
    }
    if (passport.number) {
      encrypted.number = encrypt(passport.number);
    }
    if (passport.issuedBy) {
      encrypted.issuedBy = encrypt(passport.issuedBy);
    }
    if (passport.registrationAddress) {
      encrypted.registrationAddress = encrypt(passport.registrationAddress);
    }
    if (passport.issuedDate) {
      encrypted.issuedDate = passport.issuedDate;
    }

    return encrypted;
  }

  private decryptClientPassport(client: any): any {
    if (!client || !client.passport) {
      return client;
    }

    const passport = { ...client.passport };

    try {
      if (passport.series) {
        passport.series = decrypt(passport.series);
      }
      if (passport.number) {
        passport.number = decrypt(passport.number);
      }
      if (passport.issuedBy) {
        passport.issuedBy = decrypt(passport.issuedBy);
      }
      if (passport.registrationAddress) {
        passport.registrationAddress = decrypt(passport.registrationAddress);
      }
    } catch (error) {
      this.logger.error(
        `Failed to decrypt passport for client ${client._id}: ${error.message}`,
      );
    }

    return { ...client, passport };
  }
}
