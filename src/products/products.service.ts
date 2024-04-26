import { HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { PrismaClient } from '@prisma/client';
import { CreateProductDto,UpdateProductDto} from './dto';
import { PaginationDto } from 'src/common';
import { handleSuccess } from '../common';


@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger('ProductsService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('database connected');
  }


  async create(createProductDto: CreateProductDto) {
    try {
      const product = await this.product.create({
        data: createProductDto
      });
      return handleSuccess(HttpStatus.CREATED,product);
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: HttpStatus.INTERNAL_SERVER_ERROR 
      });
    }
  }


  async findAll(paginationDto : PaginationDto) {
    try {
      const {page,limit} = paginationDto;

      const totalPage = await this.product.count({where:{available: true}});
      const lastPage = Math.ceil(totalPage/limit);
      
      return {
        status: HttpStatus.OK,
        message: 'Successful execution',
        data: await this.product.findMany({
          skip: (page-1)*limit,
          take: limit,
          where: {available: true}
        }),
        meta: {
          total : totalPage,
          page,
          lastPage
        }
      }
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: HttpStatus.INTERNAL_SERVER_ERROR  
      });
    }
  }

  async findOne(id: number) {
    try {
      const product = await  this.product.findFirst({
        where: {id,available:true}
      })
      
      if (!product) {
        throw new RpcException({
          message: `Product with id ${id} not found`,
          status: HttpStatus.NOT_FOUND
        });
      }
      
      return handleSuccess(HttpStatus.OK,product);
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: error?.error?.status??HttpStatus.INTERNAL_SERVER_ERROR 
      });
    }
  }

  async update(id: number, updateProductDto: UpdateProductDto) {
    try {
      await this.findOne(id);
      const {id:__,...data} = updateProductDto;
      
      const product = await this.product.update({
        where:{id},
        data
      });

      return handleSuccess(HttpStatus.OK,product);
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: error?.error?.status??HttpStatus.INTERNAL_SERVER_ERROR 
      });
    }
  }

  async remove(id: number) {
    try {
      await this.findOne(id);

      const product = await this.product.update({
        where:{id},
        data: {available: false}
      });
      return handleSuccess(HttpStatus.OK,product);
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: error?.error?.status??HttpStatus.INTERNAL_SERVER_ERROR 
      });
    }
  }


  async validateIds(ids:number[]){
    try {
      ids = Array.from(new Set(ids));

      const products = await this.product.findMany({
        where:{
          id: {
            in: ids
          }
        }
      });

      if (products.length !== ids.length) {
        throw new RpcException({ 
          message: 'Some product where not found', 
          status:HttpStatus.BAD_GATEWAY
        });
      }

      return products;
    } catch (error) {
      throw new RpcException({ 
        message: error.message, 
        status: error?.error?.status??HttpStatus.INTERNAL_SERVER_ERROR 
      });
    }
  }
}
