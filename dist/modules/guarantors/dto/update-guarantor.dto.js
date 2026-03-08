"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateGuarantorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_guarantor_dto_1 = require("./create-guarantor.dto");
class UpdateGuarantorDto extends (0, mapped_types_1.PartialType)((0, mapped_types_1.OmitType)(create_guarantor_dto_1.CreateGuarantorDto, ['clientId'])) {
}
exports.UpdateGuarantorDto = UpdateGuarantorDto;
//# sourceMappingURL=update-guarantor.dto.js.map