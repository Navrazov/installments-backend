import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Guarantor,
  GuarantorDocument,
} from './schemas/guarantor.schema';
import { CreateGuarantorDto } from './dto/create-guarantor.dto';
import { UpdateGuarantorDto } from './dto/update-guarantor.dto';
import { encrypt, decrypt } from '../../common/utils/encryption';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class GuarantorsService {
  private readonly logger = new Logger(GuarantorsService.name);

  constructor(
    @InjectModel(Guarantor.name)
    private readonly guarantorModel: Model<GuarantorDocument>,
  ) {}

  async create(
    orgId: Types.ObjectId,
    dto: CreateGuarantorDto,
    userId: Types.ObjectId,
  ): Promise<GuarantorDocument> {
    const data: any = {
      ...dto,
      clientId: new Types.ObjectId(dto.clientId),
      organizationId: orgId,
      createdBy: userId,
    };

    if (dto.passport) {
      data.passport = this.encryptPassport(dto.passport);
    }

    const guarantor = new this.guarantorModel(data);
    const saved = await guarantor.save();
    return this.decryptGuarantorPassport(saved.toObject());
  }

  async findAll(
    orgId: Types.ObjectId,
    page = 1,
    limit = 20,
  ): Promise<PaginatedResponse<GuarantorDocument>> {
    const skip = (page - 1) * limit;

    const filter = { organizationId: orgId };

    const [data, total] = await Promise.all([
      this.guarantorModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.guarantorModel.countDocuments(filter).exec(),
    ]);

    const decryptedData = data.map((g) => this.decryptGuarantorPassport(g));

    return {
      data: decryptedData as GuarantorDocument[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(
    orgId: Types.ObjectId,
    guarantorId: string,
  ): Promise<GuarantorDocument> {
    if (!Types.ObjectId.isValid(guarantorId)) {
      throw new BadRequestException('Invalid guarantor ID');
    }

    const guarantor = await this.guarantorModel
      .findOne({
        _id: new Types.ObjectId(guarantorId),
        organizationId: orgId,
      })
      .lean()
      .exec();

    if (!guarantor) {
      throw new NotFoundException('Guarantor not found');
    }

    return this.decryptGuarantorPassport(guarantor) as GuarantorDocument;
  }

  async findByClientId(
    orgId: Types.ObjectId,
    clientId: string,
  ): Promise<GuarantorDocument[]> {
    if (!Types.ObjectId.isValid(clientId)) {
      throw new BadRequestException('Invalid client ID');
    }

    const guarantors = await this.guarantorModel
      .find({
        organizationId: orgId,
        clientId: new Types.ObjectId(clientId),
      })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return guarantors.map((g) =>
      this.decryptGuarantorPassport(g),
    ) as GuarantorDocument[];
  }

  async update(
    orgId: Types.ObjectId,
    guarantorId: string,
    dto: UpdateGuarantorDto,
    userId: Types.ObjectId,
  ): Promise<GuarantorDocument> {
    if (!Types.ObjectId.isValid(guarantorId)) {
      throw new BadRequestException('Invalid guarantor ID');
    }

    const updateData: any = { ...dto };

    if ((dto as any).passport) {
      updateData.passport = this.encryptPassport((dto as any).passport);
    }

    const guarantor = await this.guarantorModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(guarantorId),
          organizationId: orgId,
        },
        { $set: updateData },
        { new: true, runValidators: true },
      )
      .lean()
      .exec();

    if (!guarantor) {
      throw new NotFoundException('Guarantor not found');
    }

    return this.decryptGuarantorPassport(guarantor) as GuarantorDocument;
  }

  async remove(
    orgId: Types.ObjectId,
    guarantorId: string,
  ): Promise<void> {
    if (!Types.ObjectId.isValid(guarantorId)) {
      throw new BadRequestException('Invalid guarantor ID');
    }

    const result = await this.guarantorModel
      .findOneAndDelete({
        _id: new Types.ObjectId(guarantorId),
        organizationId: orgId,
      })
      .exec();

    if (!result) {
      throw new NotFoundException('Guarantor not found');
    }
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

  private decryptGuarantorPassport(guarantor: any): any {
    if (!guarantor || !guarantor.passport) {
      return guarantor;
    }

    const passport = { ...guarantor.passport };

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
        `Failed to decrypt passport for guarantor ${guarantor._id}: ${error.message}`,
      );
    }

    return { ...guarantor, passport };
  }
}
