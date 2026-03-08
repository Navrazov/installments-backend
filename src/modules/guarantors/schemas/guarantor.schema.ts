import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export class GuarantorPassport {
  series: string;
  number: string;
  issuedBy: string;
  issuedDate: Date;
  registrationAddress: string;
}

export type GuarantorDocument = Guarantor & Document;

@Schema({ timestamps: true, collection: 'guarantors' })
export class Guarantor {
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true, index: true })
  organizationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Client', required: true, index: true })
  clientId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ type: String, trim: true, default: null })
  middleName: string | null;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true, trim: true })
  relationship: string;

  /**
   * IMPORTANT: All passport fields are stored ENCRYPTED at the application level.
   * Encryption/decryption must be handled in the service layer before persistence
   * and after retrieval. Never log or expose raw passport data.
   */
  @Prop(
    raw({
      series: { type: String, default: null },
      number: { type: String, default: null },
      issuedBy: { type: String, default: null },
      issuedDate: { type: Date, default: null },
      registrationAddress: { type: String, default: null },
    }),
  )
  passport: GuarantorPassport;

  @Prop({ type: String, trim: true, default: null })
  address: string | null;

  @Prop({ type: String, trim: true, default: null })
  notes: string | null;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const GuarantorSchema = SchemaFactory.createForClass(Guarantor);

GuarantorSchema.index({ organizationId: 1, clientId: 1 });
