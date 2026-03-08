import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as PDFDocument from 'pdfkit';
import * as ExcelJS from 'exceljs';
import { Deal, DealDocument, DealStatus } from '../deals/schemas/deal.schema';
import { Payment, PaymentDocument, PaymentMethod } from '../payments/schemas/payment.schema';
import { Client, ClientDocument, RiskStatus } from '../clients/schemas/client.schema';
import { ReportsService } from '../reports/reports.service';

interface ExportFilters {
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  search?: string;
}

const STATUS_LABELS: Record<string, string> = {
  [DealStatus.ACTIVE]: 'Активная',
  [DealStatus.CLOSED]: 'Закрыта',
  [DealStatus.OVERDUE]: 'Просрочена',
  [DealStatus.CANCELLED]: 'Отменена',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  [PaymentMethod.CASH]: 'Наличные',
  [PaymentMethod.CARD]: 'Карта',
  [PaymentMethod.TRANSFER]: 'Перевод',
  [PaymentMethod.OTHER]: 'Другое',
};

const RISK_STATUS_LABELS: Record<string, string> = {
  [RiskStatus.LOW]: 'Низкий',
  [RiskStatus.MEDIUM]: 'Средний',
  [RiskStatus.HIGH]: 'Высокий',
  [RiskStatus.CRITICAL]: 'Критический',
  [RiskStatus.BLACKLISTED]: 'Чёрный список',
};

@Injectable()
export class ExportsService {
  constructor(
    @InjectModel(Deal.name) private readonly dealModel: Model<DealDocument>,
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @InjectModel(Client.name) private readonly clientModel: Model<ClientDocument>,
    private readonly reportsService: ReportsService,
  ) {}

  // ---------------------------------------------------------------------------
  // Clients
  // ---------------------------------------------------------------------------

  async exportClientsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const clients = await this.getClients(orgId, filters);

    const headers = ['#', 'Фамилия', 'Имя', 'Телефон', 'Статус риска', 'Репутация', 'Дата регистрации'];
    const rows = clients.map((c, i) => [
      String(i + 1),
      c.lastName,
      c.firstName,
      c.phone,
      RISK_STATUS_LABELS[c.riskStatus] || c.riskStatus,
      String(c.reputationScore),
      this.formatDate(c.createdAt),
    ]);

    return this.generatePdfTable('Список клиентов', headers, rows, [25, 100, 90, 90, 80, 55, 85]);
  }

  async exportClientsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const clients = await this.getClients(orgId, filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Клиенты');

    this.addExcelHeader(sheet, 'Список клиентов', 7);

    sheet.addRow([]);
    const headerRow = sheet.addRow([
      '№', 'Фамилия', 'Имя', 'Отчество', 'Телефон', 'Статус риска', 'Репутация',
    ]);
    this.styleExcelHeaderRow(headerRow);

    clients.forEach((c, i) => {
      sheet.addRow([
        i + 1,
        c.lastName,
        c.firstName,
        c.middleName || '',
        c.phone,
        RISK_STATUS_LABELS[c.riskStatus] || c.riskStatus,
        c.reputationScore,
      ]);
    });

    this.autoFitColumns(sheet);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ---------------------------------------------------------------------------
  // Deals
  // ---------------------------------------------------------------------------

  async exportDealsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const deals = await this.getDeals(orgId, filters);

    const headers = ['#', 'Номер', 'Товар', 'Цена', 'Взнос', 'Ост. сумма', 'Срок', 'Статус'];
    const rows = deals.map((d, i) => [
      String(i + 1),
      d.dealNumber,
      this.truncate(d.productDescription, 20),
      this.formatCurrency(d.salePrice),
      this.formatCurrency(d.downPayment),
      this.formatCurrency(d.remainingAmount),
      `${d.termMonths} мес.`,
      STATUS_LABELS[d.status] || d.status,
    ]);

    return this.generatePdfTable('Список сделок', headers, rows, [22, 65, 80, 65, 60, 65, 40, 60]);
  }

  async exportDealsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const deals = await this.getDeals(orgId, filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Сделки');

    this.addExcelHeader(sheet, 'Список сделок', 10);

    sheet.addRow([]);
    const headerRow = sheet.addRow([
      '№', 'Номер сделки', 'Описание товара', 'Закупочная цена, ₽',
      'Цена продажи, ₽', 'Наценка, ₽', 'Первоначальный взнос, ₽',
      'Остаток, ₽', 'Срок (мес.)', 'Статус',
    ]);
    this.styleExcelHeaderRow(headerRow);

    deals.forEach((d, i) => {
      sheet.addRow([
        i + 1,
        d.dealNumber,
        d.productDescription,
        d.purchasePrice,
        d.salePrice,
        d.markup,
        d.downPayment,
        d.remainingAmount,
        d.termMonths,
        STATUS_LABELS[d.status] || d.status,
      ]);
    });

    // Format currency columns
    [4, 5, 6, 7, 8].forEach((col) => {
      sheet.getColumn(col).numFmt = '#,##0.00 "₽"';
    });

    this.autoFitColumns(sheet);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ---------------------------------------------------------------------------
  // Payments
  // ---------------------------------------------------------------------------

  async exportPaymentsToPdf(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const payments = await this.getPayments(orgId, filters);

    const headers = ['#', 'Дата', 'Сумма', 'Способ оплаты', 'Досрочный', 'Ост. после оплаты'];
    const rows = payments.map((p, i) => [
      String(i + 1),
      this.formatDate(p.paymentDate),
      this.formatCurrency(p.amount),
      PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
      p.isEarly ? 'Да' : 'Нет',
      this.formatCurrency(p.remainingAfterPayment),
    ]);

    return this.generatePdfTable('Список платежей', headers, rows, [25, 80, 80, 80, 55, 90]);
  }

  async exportPaymentsToExcel(orgId: string, filters: ExportFilters): Promise<Buffer> {
    const payments = await this.getPayments(orgId, filters);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Платежи');

    this.addExcelHeader(sheet, 'Список платежей', 7);

    sheet.addRow([]);
    const headerRow = sheet.addRow([
      '№', 'Дата платежа', 'Сумма, ₽', 'Способ оплаты',
      'Плановая дата', 'Досрочный', 'Остаток после оплаты, ₽',
    ]);
    this.styleExcelHeaderRow(headerRow);

    payments.forEach((p, i) => {
      sheet.addRow([
        i + 1,
        new Date(p.paymentDate),
        p.amount,
        PAYMENT_METHOD_LABELS[p.paymentMethod] || p.paymentMethod,
        p.scheduledDate ? new Date(p.scheduledDate) : '',
        p.isEarly ? 'Да' : 'Нет',
        p.remainingAfterPayment,
      ]);
    });

    sheet.getColumn(2).numFmt = 'DD.MM.YYYY';
    sheet.getColumn(3).numFmt = '#,##0.00 "₽"';
    sheet.getColumn(5).numFmt = 'DD.MM.YYYY';
    sheet.getColumn(7).numFmt = '#,##0.00 "₽"';

    this.autoFitColumns(sheet);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ---------------------------------------------------------------------------
  // Report exports
  // ---------------------------------------------------------------------------

  async exportReportToPdf(
    orgId: string,
    reportType: string,
    params: { dateFrom?: string; dateTo?: string; monthsBack?: number },
  ): Promise<Buffer> {
    const data = await this.getReportData(orgId, reportType, params);
    const { title, headers, rows, colWidths } = this.formatReportForTable(reportType, data);
    return this.generatePdfTable(title, headers, rows, colWidths);
  }

  async exportReportToExcel(
    orgId: string,
    reportType: string,
    params: { dateFrom?: string; dateTo?: string; monthsBack?: number },
  ): Promise<Buffer> {
    const data = await this.getReportData(orgId, reportType, params);
    const { title, headers, rows } = this.formatReportForTable(reportType, data);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Отчёт');

    this.addExcelHeader(sheet, title, headers.length);

    sheet.addRow([]);
    const headerRow = sheet.addRow(headers);
    this.styleExcelHeaderRow(headerRow);

    for (const row of rows) {
      sheet.addRow(row);
    }

    this.autoFitColumns(sheet);

    return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
  }

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------

  private async getClients(orgId: string, filters: ExportFilters) {
    const organizationId = new Types.ObjectId(orgId);
    const query: any = { organizationId };

    if (filters.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { firstName: regex },
        { lastName: regex },
        { phone: regex },
      ];
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    return this.clientModel
      .find(query)
      .sort({ lastName: 1, firstName: 1 })
      .lean()
      .exec();
  }

  private async getDeals(orgId: string, filters: ExportFilters) {
    const organizationId = new Types.ObjectId(orgId);
    const query: any = { organizationId };

    if (filters.status) {
      query.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      query.createdAt = {};
      if (filters.dateFrom) query.createdAt.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.createdAt.$lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    return this.dealModel
      .find(query)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  private async getPayments(orgId: string, filters: ExportFilters) {
    const organizationId = new Types.ObjectId(orgId);
    const query: any = { organizationId };

    if (filters.dateFrom || filters.dateTo) {
      query.paymentDate = {};
      if (filters.dateFrom) query.paymentDate.$gte = new Date(filters.dateFrom);
      if (filters.dateTo) query.paymentDate.$lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    return this.paymentModel
      .find(query)
      .sort({ paymentDate: -1 })
      .lean()
      .exec();
  }

  private async getReportData(
    orgId: string,
    reportType: string,
    params: { dateFrom?: string; dateTo?: string; monthsBack?: number },
  ): Promise<any> {
    switch (reportType) {
      case 'dashboard':
        return this.reportsService.getDashboardSummary(orgId);
      case 'deals':
        return this.reportsService.getDealsReport(orgId, params.dateFrom, params.dateTo);
      case 'payments':
        return this.reportsService.getPaymentsReport(orgId, params.dateFrom, params.dateTo);
      case 'overdue':
        return this.reportsService.getOverdueReport(orgId);
      case 'clients':
        return this.reportsService.getClientsReport(orgId);
      case 'managers':
        return this.reportsService.getManagerPerformance(orgId, params.dateFrom, params.dateTo);
      case 'branches':
        return this.reportsService.getBranchPerformance(orgId, params.dateFrom, params.dateTo);
      case 'dynamics':
        return this.reportsService.getMonthlyDynamics(orgId, params.monthsBack || 12);
      case 'down-payments':
        return this.reportsService.getDownPaymentAnalysis(orgId);
      case 'terms':
        return this.reportsService.getTermDistribution(orgId);
      case 'collection-efficiency':
        return this.reportsService.getCollectionEfficiency(orgId, params.dateFrom, params.dateTo);
      default:
        return this.reportsService.getDashboardSummary(orgId);
    }
  }

  private formatReportForTable(
    reportType: string,
    data: any,
  ): { title: string; headers: string[]; rows: string[][]; colWidths: number[] } {
    switch (reportType) {
      case 'dashboard':
        return {
          title: 'Сводная панель',
          headers: ['Показатель', 'Значение'],
          rows: [
            ['Всего сделок', String(data.totalDeals)],
            ['Активные сделки', String(data.activeDeals)],
            ['Закрытые сделки', String(data.closedDeals)],
            ['Просроченные сделки', String(data.overdueDeals)],
            ['Общий объём', this.formatCurrency(data.totalVolume)],
            ['Собрано', this.formatCurrency(data.totalCollected)],
            ['Дебиторская задолженность', this.formatCurrency(data.totalReceivable)],
            ['Просроченная задолженность', this.formatCurrency(data.overdueReceivable)],
            ['Новых клиентов (мес.)', String(data.newClientsThisMonth)],
            ['Ср. дней просрочки', String(data.averageOverdueDays)],
          ],
          colWidths: [220, 200],
        };

      case 'overdue':
        return {
          title: 'Отчёт по просрочкам',
          headers: ['Клиент', 'Телефон', 'Сумма просрочки', 'Макс. дней', 'Кол-во'],
          rows: (data.topOverdueClients || []).map((c: any) => [
            c.clientName,
            c.phone || '-',
            this.formatCurrency(c.totalOverdueAmount),
            String(c.maxOverdueDays),
            String(c.overdueCount),
          ]),
          colWidths: [120, 80, 80, 65, 45],
        };

      case 'managers':
        return {
          title: 'Эффективность менеджеров',
          headers: ['Менеджер', 'Сделки', 'Объём', 'Собрано', 'Процент сбора'],
          rows: (data.managers || []).map((m: any) => [
            m.managerName,
            String(m.totalDeals),
            this.formatCurrency(m.totalVolume),
            this.formatCurrency(m.totalCollected),
            `${m.collectionRate}%`,
          ]),
          colWidths: [120, 50, 80, 80, 65],
        };

      case 'branches':
        return {
          title: 'Эффективность филиалов',
          headers: ['Филиал', 'Сделки', 'Объём', 'Собрано', 'Остаток'],
          rows: (data.branches || []).map((b: any) => [
            b.branchName,
            String(b.totalDeals),
            this.formatCurrency(b.totalVolume),
            this.formatCurrency(b.totalCollected),
            this.formatCurrency(b.totalRemaining),
          ]),
          colWidths: [120, 50, 80, 80, 80],
        };

      case 'dynamics':
        return {
          title: 'Ежемесячная динамика',
          headers: ['Месяц', 'Новые сделки', 'Объём', 'Платежи', 'Собрано', 'Просрочки', 'Новые клиенты'],
          rows: (data.months || []).map((m: any) => [
            `${String(m.month).padStart(2, '0')}.${m.year}`,
            String(m.newDeals),
            this.formatCurrency(m.volume),
            String(m.paymentsCount),
            this.formatCurrency(m.collected),
            String(m.newOverdue),
            String(m.newClients),
          ]),
          colWidths: [55, 55, 70, 50, 70, 55, 55],
        };

      case 'collection-efficiency':
        return {
          title: 'Эффективность сбора',
          headers: ['Месяц', 'Ожидаемая сумма', 'Фактическая сумма', 'Эффективность'],
          rows: (data.monthly || []).map((m: any) => [
            `${String(m.month).padStart(2, '0')}.${m.year}`,
            this.formatCurrency(m.expectedAmount),
            this.formatCurrency(m.actualAmount),
            `${m.efficiency}%`,
          ]),
          colWidths: [70, 100, 100, 80],
        };

      case 'down-payments':
        return {
          title: 'Анализ первоначальных взносов',
          headers: ['Диапазон %', 'Количество', 'Объём', 'Ср. взнос'],
          rows: (data.distribution || []).map((d: any) => [
            `${d.rangeFrom}% - ${d.rangeFrom + 10}%`,
            String(d.count),
            this.formatCurrency(d.totalVolume),
            this.formatCurrency(d.avgDownPayment),
          ]),
          colWidths: [80, 65, 100, 100],
        };

      case 'terms':
        return {
          title: 'Распределение сроков рассрочки',
          headers: ['Срок (мес.)', 'Количество', 'Объём', 'Ср. платёж'],
          rows: (data.distribution || []).map((d: any) => [
            String(d.termMonths),
            String(d.count),
            this.formatCurrency(d.totalVolume),
            this.formatCurrency(d.avgMonthlyPayment),
          ]),
          colWidths: [70, 65, 100, 100],
        };

      default:
        return {
          title: 'Отчёт',
          headers: ['Ключ', 'Значение'],
          rows: Object.entries(data)
            .filter(([, v]) => typeof v !== 'object')
            .map(([k, v]) => [k, String(v)]),
          colWidths: [200, 200],
        };
    }
  }

  // ---------------------------------------------------------------------------
  // PDF generation
  // ---------------------------------------------------------------------------

  private generatePdfTable(
    title: string,
    headers: string[],
    rows: string[][],
    colWidths: number[],
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        layout: 'landscape',
        margin: 30,
        bufferPages: true,
      });

      const chunks: Uint8Array[] = [];
      doc.on('data', (chunk: Uint8Array) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Title
      doc.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
      doc.moveDown(0.3);

      const reportDate = `Дата формирования: ${this.formatDate(new Date())}`;
      doc.fontSize(8).font('Helvetica').text(reportDate, { align: 'center' });
      doc.moveDown(0.8);

      const startX = doc.x;
      const rowHeight = 18;
      const headerHeight = 22;
      const fontSize = 7;
      const headerFontSize = 7.5;

      // Table header
      let y = doc.y;
      doc.save();
      doc.rect(startX, y, colWidths.reduce((s, w) => s + w, 0), headerHeight)
        .fill('#2c3e50');
      doc.restore();

      doc.fillColor('#ffffff').fontSize(headerFontSize).font('Helvetica-Bold');
      let x = startX;
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], x + 3, y + 5, {
          width: colWidths[i] - 6,
          height: headerHeight,
          ellipsis: true,
        });
        x += colWidths[i];
      }

      y += headerHeight;

      // Table rows
      doc.fillColor('#000000').fontSize(fontSize).font('Helvetica');

      for (let r = 0; r < rows.length; r++) {
        // New page check
        if (y + rowHeight > doc.page.height - 30) {
          doc.addPage();
          y = 30;
        }

        // Alternating row background
        if (r % 2 === 0) {
          doc.save();
          doc.rect(startX, y, colWidths.reduce((s, w) => s + w, 0), rowHeight)
            .fill('#f8f9fa');
          doc.restore();
          doc.fillColor('#000000');
        }

        x = startX;
        for (let c = 0; c < rows[r].length; c++) {
          const cellWidth = colWidths[c] || 60;
          doc.text(rows[r][c] || '', x + 3, y + 4, {
            width: cellWidth - 6,
            height: rowHeight,
            ellipsis: true,
          });
          x += cellWidth;
        }

        y += rowHeight;
      }

      // Footer
      const pageCount = doc.bufferedPageRange().count;
      for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).font('Helvetica').fillColor('#888888');
        doc.text(
          `Страница ${i + 1} из ${pageCount}`,
          30,
          doc.page.height - 25,
          { align: 'center', width: doc.page.width - 60 },
        );
      }

      doc.end();
    });
  }

  // ---------------------------------------------------------------------------
  // Excel helpers
  // ---------------------------------------------------------------------------

  private addExcelHeader(sheet: ExcelJS.Worksheet, title: string, colSpan: number): void {
    const titleRow = sheet.addRow([title]);
    titleRow.font = { size: 14, bold: true, color: { argb: 'FF2C3E50' } };
    sheet.mergeCells(1, 1, 1, colSpan);
    titleRow.alignment = { horizontal: 'center' };

    const dateRow = sheet.addRow([`Дата формирования: ${this.formatDate(new Date())}`]);
    dateRow.font = { size: 9, italic: true, color: { argb: 'FF888888' } };
    sheet.mergeCells(2, 1, 2, colSpan);
    dateRow.alignment = { horizontal: 'center' };
  }

  private styleExcelHeaderRow(row: ExcelJS.Row): void {
    row.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF2C3E50' },
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
      };
    });
    row.height = 24;
  }

  private autoFitColumns(sheet: ExcelJS.Worksheet): void {
    sheet.columns.forEach((column) => {
      if (!column || !column.eachCell) return;
      let maxLength = 10;
      column.eachCell({ includeEmpty: false }, (cell) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        maxLength = Math.max(maxLength, cellValue.length + 2);
      });
      column.width = Math.min(maxLength, 50);
    });
  }

  // ---------------------------------------------------------------------------
  // Formatting helpers
  // ---------------------------------------------------------------------------

  private formatCurrency(amount: number): string {
    if (amount == null) return '0 ₽';
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }

  private formatDate(date: Date | string): string {
    const d = date instanceof Date ? date : new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}.${month}.${year}`;
  }

  private truncate(str: string, maxLen: number): string {
    if (!str) return '';
    return str.length > maxLen ? str.slice(0, maxLen - 1) + '\u2026' : str;
  }
}
