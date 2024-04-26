import { HttpStatus } from '@nestjs/common';
import { IProduct } from 'src/products/interfaces';


export function handleSuccess(status: HttpStatus, data: IProduct | IProduct[]) {
  return {
    status,
    message: 'Successful execution',
    data,
  };
}
