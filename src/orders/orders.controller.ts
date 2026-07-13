import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { IsString, IsNotEmpty, IsArray, ArrayNotEmpty } from 'class-validator';

export class CreateOrderDto {
  @IsString({ message: 'Nama pelanggan harus berupa string' })
  @IsNotEmpty({ message: 'Nama pelanggan tidak boleh kosong' })
  customerName!: string;

  @IsString({ message: 'Nomor telepon harus berupa string' })
  @IsNotEmpty({ message: 'Nomor telepon tidak boleh kosong' })
  customerPhone!: string;

  @IsString({ message: 'Alamat pengiriman harus berupa string' })
  @IsNotEmpty({ message: 'Alamat pengiriman tidak boleh kosong' })
  customerAddress!: string;

  @IsArray({ message: 'Product IDs harus berupa array' })
  @ArrayNotEmpty({ message: 'Order minimal harus memiliki satu produk' })
  @IsString({ each: true, message: 'Setiap ID produk harus berupa string' })
  productIds!: string[];
}

import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Orders')
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }
}
