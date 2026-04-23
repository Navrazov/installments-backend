import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Investor, InvestorDocument } from './schemas/investor.schema';
import { Investment, InvestmentDocument, InvestmentStatus } from './schemas/investment.schema';
import { CreateInvestorDto } from './dto/create-investor.dto';
import { UpdateInvestorDto } from './dto/update-investor.dto';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { Deal, DealDocument, DealStatus } from '../deals/schemas/deal.schema';

@Injectable()
export class InvestorsService {
  constructor(
    @InjectModel(Investor.name) private investorModel: Model<InvestorDocument>,
    @InjectModel(Investment.name) private investmentModel: Model<InvestmentDocument>,
    @InjectModel(Deal.name) private dealModel: Model<DealDocument>,
  ) {}

  // ─── Investors CRUD ────────────────────────────────────────────────────────

  async createInvestor(
    orgId: Types.ObjectId,
    dto: CreateInvestorDto,
    userId: Types.ObjectId,
  ): Promise<InvestorDocument> {
    const investor = new this.investorModel({
      organizationId: orgId,
      ...dto,
      createdBy: userId,
    });
    return investor.save();
  }

  async findAllInvestors(
    orgId: Types.ObjectId,
    page = 1,
    limit = 20,
    search?: string,
  ) {
    const filter: any = { organizationId: orgId };
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [
        { firstName: re },
        { lastName: re },
        { phone: re },
        { email: re },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.investorModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.investorModel.countDocuments(filter).exec(),
    ]);

    return { data, total, page, limit };
  }

  async findInvestorById(orgId: Types.ObjectId, id: string): Promise<InvestorDocument> {
    const investor = await this.investorModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgId })
      .exec();
    if (!investor) throw new NotFoundException('Инвестор не найден');
    return investor;
  }

  async updateInvestor(
    orgId: Types.ObjectId,
    id: string,
    dto: UpdateInvestorDto,
  ): Promise<InvestorDocument> {
    const investor = await this.investorModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), organizationId: orgId },
        { $set: dto },
        { new: true },
      )
      .exec();
    if (!investor) throw new NotFoundException('Инвестор не найден');
    return investor;
  }

  // ─── Investments CRUD ──────────────────────────────────────────────────────

  async createInvestment(
    orgId: Types.ObjectId,
    dto: CreateInvestmentDto,
    userId: Types.ObjectId,
  ): Promise<InvestmentDocument> {
    // Verify investor belongs to org
    const investor = await this.investorModel.findOne({
      _id: new Types.ObjectId(dto.investorId),
      organizationId: orgId,
    }).exec();
    if (!investor) throw new NotFoundException('Инвестор не найден');

    // Verify deal belongs to org
    const deal = await this.dealModel.findOne({
      _id: new Types.ObjectId(dto.dealId),
      organizationId: orgId,
    }).exec();
    if (!deal) throw new NotFoundException('Сделка не найдена');

    // Check deal is not cancelled
    if (deal.status === DealStatus.CANCELLED) {
      throw new BadRequestException('Нельзя добавить инвестицию к отменённой сделке');
    }

    // Check no existing investment for this deal
    const existing = await this.investmentModel.findOne({
      organizationId: orgId,
      dealId: new Types.ObjectId(dto.dealId),
    }).exec();
    if (existing) {
      throw new BadRequestException('По этой сделке уже есть инвестиция');
    }

    const investment = new this.investmentModel({
      organizationId: orgId,
      investorId: new Types.ObjectId(dto.investorId),
      dealId: new Types.ObjectId(dto.dealId),
      investedAmount: dto.investedAmount,
      profitSharePercent: dto.profitSharePercent,
      status: deal.status === DealStatus.CLOSED ? InvestmentStatus.COMPLETED : InvestmentStatus.ACTIVE,
      notes: dto.notes,
      createdBy: userId,
    });

    return investment.save();
  }

  async findInvestmentsByInvestor(orgId: Types.ObjectId, investorId: string) {
    const investments = await this.investmentModel
      .find({
        organizationId: orgId,
        investorId: new Types.ObjectId(investorId),
      })
      .populate<{ dealId: DealDocument }>('dealId',
        'dealNumber productDescription purchasePrice salePrice markup totalAmount remainingAmount status clientId',
      )
      .sort({ createdAt: -1 })
      .exec();

    return investments.map(inv => this.enrichInvestment(inv));
  }

  async findInvestmentByDeal(orgId: Types.ObjectId, dealId: string) {
    const inv = await this.investmentModel
      .findOne({ organizationId: orgId, dealId: new Types.ObjectId(dealId) })
      .populate<{ investorId: InvestorDocument }>('investorId', 'firstName lastName phone email')
      .exec();
    if (!inv) return null;
    return inv;
  }

  async findAllInvestments(orgId: Types.ObjectId, page = 1, limit = 20) {
    const filter = { organizationId: orgId };
    const skip = (page - 1) * limit;
    const [raw, total] = await Promise.all([
      this.investmentModel
        .find(filter)
        .populate<{ investorId: InvestorDocument }>('investorId', 'firstName lastName phone')
        .populate<{ dealId: DealDocument }>('dealId',
          'dealNumber productDescription purchasePrice salePrice markup totalAmount remainingAmount status',
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.investmentModel.countDocuments(filter).exec(),
    ]);

    return { data: raw.map(inv => this.enrichInvestment(inv)), total, page, limit };
  }

  async deleteInvestment(orgId: Types.ObjectId, id: string) {
    const inv = await this.investmentModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: orgId,
    }).exec();
    if (!inv) throw new NotFoundException('Инвестиция не найдена');
    if (inv.status === InvestmentStatus.COMPLETED) {
      throw new BadRequestException('Нельзя удалить завершённую инвестицию');
    }
    await inv.deleteOne();
  }

  // ─── Portfolio stats for one investor ─────────────────────────────────────

  async getInvestorPortfolio(orgId: Types.ObjectId, investorId: string) {
    const investments = await this.findInvestmentsByInvestor(orgId, investorId);

    const totalInvested = investments.reduce((s, i) => s + i.investedAmount, 0);
    const totalExpectedReturn = investments.reduce((s, i) => s + i.expectedReturn, 0);
    const totalReturnPaid = investments.reduce((s, i) => s + i.returnPaid, 0);
    const totalReturnRemaining = investments.reduce((s, i) => s + i.returnRemaining, 0);
    const activeCount = investments.filter(i => i.status === 'active').length;
    const completedCount = investments.filter(i => i.status === 'completed').length;

    return {
      totalInvested,
      totalExpectedReturn,
      totalReturnPaid,
      totalReturnRemaining,
      totalProfit: totalExpectedReturn - totalInvested,
      activeCount,
      completedCount,
      investments,
    };
  }

  // ─── Org-wide investor summary ─────────────────────────────────────────────

  async getOrgInvestorSummary(orgId: Types.ObjectId) {
    const [investorsCount, investments] = await Promise.all([
      this.investorModel.countDocuments({ organizationId: orgId, isActive: true }),
      this.investmentModel
        .find({ organizationId: orgId })
        .populate<{ dealId: DealDocument }>('dealId',
          'markup totalAmount remainingAmount status',
        )
        .exec(),
    ]);

    const enriched = investments.map(inv => this.enrichInvestment(inv));

    return {
      totalInvestors: investorsCount,
      totalInvested: enriched.reduce((s, i) => s + i.investedAmount, 0),
      totalExpectedReturn: enriched.reduce((s, i) => s + i.expectedReturn, 0),
      totalReturnPaid: enriched.reduce((s, i) => s + i.returnPaid, 0),
      totalReturnRemaining: enriched.reduce((s, i) => s + i.returnRemaining, 0),
      activeInvestments: enriched.filter(i => i.status === 'active').length,
      completedInvestments: enriched.filter(i => i.status === 'completed').length,
    };
  }

  // ─── Helper: enrich investment with computed returns ───────────────────────

  private enrichInvestment(inv: any) {
    const deal: DealDocument | null = inv.dealId as any;
    const markup = deal?.markup ?? 0;
    const totalAmount = deal?.totalAmount ?? 0;
    const remainingAmount = deal?.remainingAmount ?? 0;
    const paidAmount = totalAmount - remainingAmount;
    const collectionProgress = totalAmount > 0 ? paidAmount / totalAmount : 0;

    const investorProfit = markup * (inv.profitSharePercent / 100);
    const expectedReturn = inv.investedAmount + investorProfit;
    const returnPaid = Math.round(expectedReturn * collectionProgress * 100) / 100;
    const returnRemaining = Math.round((expectedReturn - returnPaid) * 100) / 100;

    // Auto-sync status with deal
    let status = inv.status;
    if (deal?.status === DealStatus.CLOSED) status = InvestmentStatus.COMPLETED;
    else if (deal?.status === DealStatus.CANCELLED) status = InvestmentStatus.CANCELLED;
    else if (deal?.status === DealStatus.ACTIVE || deal?.status === DealStatus.OVERDUE) {
      status = InvestmentStatus.ACTIVE;
    }

    return {
      _id: inv._id,
      investorId: inv.investorId,
      dealId: inv.dealId,
      investedAmount: inv.investedAmount,
      profitSharePercent: inv.profitSharePercent,
      investorProfit,
      expectedReturn,
      returnPaid,
      returnRemaining,
      collectionProgress: Math.round(collectionProgress * 100),
      status,
      notes: inv.notes,
      createdAt: inv.createdAt,
    };
  }
}
