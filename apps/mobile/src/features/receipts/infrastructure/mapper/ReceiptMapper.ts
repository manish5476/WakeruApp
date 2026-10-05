import type { Receipt } from '../../types/receipt.types';
import type { ReceiptAPIModel } from '../dto/ReceiptDTO';

export class ReceiptMapper {
  static toDomain(dto: ReceiptAPIModel): Receipt {
    const { _id, ...rest } = dto;
    return {
      id: _id,
      ...rest,
    };
  }

  static toDTO(receipt: Receipt): ReceiptAPIModel {
    const { id, ...rest } = receipt;
    return {
      _id: id,
      ...rest,
    };
  }
}
