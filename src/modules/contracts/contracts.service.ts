import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Contract, ContractDocument } from './schemas/contract.schema';
import { Deal, DealDocument } from '../deals/schemas/deal.schema';
import { Client, ClientDocument } from '../clients/schemas/client.schema';
import {
  Organization,
  OrganizationDocument,
} from '../organizations/schemas/organization.schema';

@Injectable()
export class ContractsService {
  constructor(
    @InjectModel(Contract.name)
    private readonly contractModel: Model<ContractDocument>,
    @InjectModel(Deal.name) private readonly dealModel: Model<DealDocument>,
    @InjectModel(Client.name)
    private readonly clientModel: Model<ClientDocument>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<OrganizationDocument>,
  ) {}

  async createFromDeal(
    orgId: Types.ObjectId,
    dealId: Types.ObjectId,
  ): Promise<ContractDocument> {
    const existing = await this.contractModel
      .findOne({ organizationId: orgId, dealId })
      .exec();
    if (existing) return existing;

    const deal = await this.dealModel.findById(dealId).exec();
    if (!deal) throw new NotFoundException('Deal not found');

    const client = await this.clientModel.findById(deal.clientId).exec();
    if (!client) throw new NotFoundException('Client not found');

    const org = await this.organizationModel.findById(orgId).exec();

    const contractNumber = await this.generateContractNumber();
    const templateData = this.buildSnapshot(deal, client, org);

    try {
      const contract = new this.contractModel({
        organizationId: orgId,
        dealId,
        contractNumber,
        templateData,
        generatedAt: new Date(),
      });
      return await contract.save();
    } catch (err: any) {
      if (err?.code === 11000) {
        const dup = await this.contractModel
          .findOne({ organizationId: orgId, dealId })
          .exec();
        if (dup) return dup;
        throw new ConflictException('Contract already exists');
      }
      throw err;
    }
  }

  async findByDeal(
    orgId: Types.ObjectId,
    dealId: string,
  ): Promise<ContractDocument | null> {
    return this.contractModel
      .findOne({
        organizationId: orgId,
        dealId: new Types.ObjectId(dealId),
      })
      .exec();
  }

  async findById(
    orgId: Types.ObjectId,
    id: string,
  ): Promise<ContractDocument> {
    const contract = await this.contractModel
      .findOne({ _id: new Types.ObjectId(id), organizationId: orgId })
      .exec();
    if (!contract) throw new NotFoundException('Contract not found');
    return contract;
  }

  async regenerate(
    orgId: Types.ObjectId,
    id: string,
  ): Promise<ContractDocument> {
    const contract = await this.findById(orgId, id);
    const deal = await this.dealModel.findById(contract.dealId).exec();
    if (!deal) throw new NotFoundException('Deal not found');
    const client = await this.clientModel.findById(deal.clientId).exec();
    if (!client) throw new NotFoundException('Client not found');
    const org = await this.organizationModel.findById(orgId).exec();

    contract.templateData = this.buildSnapshot(deal, client, org);
    contract.generatedAt = new Date();
    return contract.save();
  }

  renderHtml(contract: ContractDocument): string {
    return renderContractHtml(contract);
  }

  private async generateContractNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `HLC-${year}-`;

    const last = await this.contractModel
      .findOne({ contractNumber: { $regex: `^${prefix}` } })
      .sort({ contractNumber: -1 })
      .select('contractNumber')
      .exec();

    let seq = 1;
    if (last) {
      const tail = last.contractNumber.split('-').pop() || '0';
      seq = parseInt(tail, 10) + 1;
    }
    return `${prefix}${String(seq).padStart(6, '0')}`;
  }

  private buildSnapshot(
    deal: DealDocument,
    client: ClientDocument,
    org: OrganizationDocument | null,
  ): Record<string, any> {
    return {
      deal: {
        dealNumber: deal.dealNumber,
        productDescription: deal.productDescription,
        purchasePrice: deal.purchasePrice,
        salePrice: deal.salePrice,
        downPayment: deal.downPayment,
        termMonths: deal.termMonths,
        monthlyPayment: deal.monthlyPayment,
        startDate: deal.startDate,
        firstPaymentDate: deal.firstPaymentDate,
        endDate: deal.endDate,
        totalAmount: deal.totalAmount,
        remainingAmount: deal.remainingAmount,
        paymentSchedule: deal.paymentSchedule.map((p) => ({
          date: p.date,
          amount: p.amount,
        })),
      },
      client: {
        firstName: client.firstName,
        lastName: client.lastName,
        middleName: client.middleName ?? null,
        phone: client.phone,
        birthDate: client.birthDate ?? null,
        address: client.address ?? null,
        actualAddress: client.actualAddress ?? null,
        passport: client.passport
          ? {
              series: '***',
              number: '***',
              issuedBy: client.passport.issuedBy ?? '',
              issuedDate: client.passport.issuedDate ?? null,
              registrationAddress:
                client.passport.registrationAddress ?? null,
            }
          : null,
      },
      organization: org
        ? {
            name: org.name,
            slug: org.slug,
          }
        : null,
    };
  }
}

function formatMoney(n: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n || 0);
}

function formatDate(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const date = typeof d === 'string' ? new Date(d) : d;
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function escapeHtml(s: unknown): string {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderContractHtml(contract: ContractDocument): string {
  const data = contract.templateData;
  const d = data.deal;
  const c = data.client;
  const o = data.organization;

  const clientFullName = escapeHtml(
    [c.lastName, c.firstName, c.middleName].filter(Boolean).join(' '),
  );
  const orgName = escapeHtml(o?.name || 'Организация');
  const issueDate = formatDate(contract.generatedAt);

  const scheduleRows = (d.paymentSchedule as { date: string; amount: number }[])
    .map(
      (p, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${formatDate(p.date)}</td>
        <td style="text-align:right">${escapeHtml(formatMoney(p.amount))}</td>
      </tr>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Договор ${escapeHtml(contract.contractNumber)}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; line-height: 1.5; font-size: 13px; }
    h1 { text-align: center; font-size: 16px; margin: 0 0 6px; }
    h2 { font-size: 14px; margin: 18px 0 8px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
    .meta { text-align: center; color: #555; font-size: 12px; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; margin: 8px 0; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; }
    th { background: #f5f5f5; text-align: left; }
    .row { display: flex; gap: 24px; margin: 6px 0; }
    .row .label { color: #666; min-width: 180px; }
    .row .value { font-weight: 500; }
    .sign { margin-top: 40px; display: flex; justify-content: space-between; gap: 40px; }
    .sign > div { flex: 1; }
    .sign .line { border-bottom: 1px solid #333; margin: 36px 0 4px; height: 1px; }
    .sign .hint { font-size: 11px; color: #666; }
    .para { margin: 10px 0; text-align: justify; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <h1>Договор рассрочки № ${escapeHtml(contract.contractNumber)}</h1>
  <div class="meta">г. ________ &nbsp;&nbsp;&middot;&nbsp;&nbsp; ${issueDate}</div>

  <div class="para">
    <strong>${orgName}</strong>, именуемое в дальнейшем «Продавец», с одной стороны,
    и гражданин(ка) <strong>${clientFullName}</strong>, именуемый(ая) в дальнейшем «Покупатель»,
    с другой стороны, заключили настоящий договор о нижеследующем.
  </div>

  <h2>1. Предмет договора</h2>
  <div class="para">
    1.1. Продавец передаёт в собственность Покупателя товар: <strong>${escapeHtml(d.productDescription)}</strong>,
    а Покупатель обязуется принять товар и оплатить его стоимость на условиях рассрочки в соответствии
    с настоящим договором. Сделка не содержит ссудного процента и соответствует принципам халяль-торговли
    (купля-продажа с наценкой).
  </div>

  <h2>2. Цена и порядок оплаты</h2>
  <div class="row"><span class="label">Цена товара (рассрочка):</span><span class="value">${escapeHtml(formatMoney(d.salePrice))}</span></div>
  <div class="row"><span class="label">Первоначальный взнос:</span><span class="value">${escapeHtml(formatMoney(d.downPayment))}</span></div>
  <div class="row"><span class="label">Сумма к рассрочке:</span><span class="value">${escapeHtml(formatMoney(d.salePrice - d.downPayment))}</span></div>
  <div class="row"><span class="label">Срок рассрочки:</span><span class="value">${d.termMonths} мес.</span></div>
  <div class="row"><span class="label">Ежемесячный платёж:</span><span class="value">${escapeHtml(formatMoney(d.monthlyPayment))}</span></div>
  <div class="row"><span class="label">Дата начала:</span><span class="value">${formatDate(d.startDate)}</span></div>
  <div class="row"><span class="label">Дата первого платежа:</span><span class="value">${formatDate(d.firstPaymentDate)}</span></div>
  <div class="row"><span class="label">Дата окончания:</span><span class="value">${formatDate(d.endDate)}</span></div>

  <h2>3. График платежей</h2>
  <table>
    <thead>
      <tr><th style="width:50px">№</th><th>Дата</th><th style="width:180px; text-align:right">Сумма</th></tr>
    </thead>
    <tbody>${scheduleRows}</tbody>
  </table>

  <h2>4. Данные Покупателя</h2>
  <div class="row"><span class="label">ФИО:</span><span class="value">${clientFullName}</span></div>
  <div class="row"><span class="label">Телефон:</span><span class="value">${escapeHtml(c.phone || '—')}</span></div>
  <div class="row"><span class="label">Адрес регистрации:</span><span class="value">${escapeHtml(c.passport?.registrationAddress || c.address || '—')}</span></div>
  <div class="row"><span class="label">Адрес фактический:</span><span class="value">${escapeHtml(c.actualAddress || '—')}</span></div>

  <h2>5. Обязанности сторон</h2>
  <div class="para">
    5.1. Продавец обязуется передать товар в исправном состоянии в день подписания настоящего договора.
    5.2. Покупатель обязуется вносить ежемесячные платежи в соответствии с графиком, начиная с даты первого платежа.
    5.3. При просрочке платежей Покупатель несёт ответственность в соответствии с внутренними правилами Продавца.
    Начисление процентов на просроченную сумму не производится.
    5.4. Досрочное погашение допускается в любой момент без штрафов.
  </div>

  <h2>6. Заключительные положения</h2>
  <div class="para">
    6.1. Настоящий договор вступает в силу с момента его подписания сторонами и действует до полного исполнения обязательств.
    6.2. Все изменения и дополнения оформляются в письменной форме.
    6.3. Договор составлен в двух экземплярах, имеющих одинаковую юридическую силу, по одному для каждой стороны.
  </div>

  <div class="sign">
    <div>
      <strong>Продавец</strong>
      <div class="line"></div>
      <div class="hint">${orgName}, подпись и печать</div>
    </div>
    <div>
      <strong>Покупатель</strong>
      <div class="line"></div>
      <div class="hint">${clientFullName}, подпись</div>
    </div>
  </div>
</body>
</html>`;
}
