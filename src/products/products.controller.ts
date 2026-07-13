import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ProductStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from '../storage/storage.service';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsArray,
  IsOptional,
  IsEnum,
} from 'class-validator';

export class CreateProductDto {
  @IsString({ message: 'Nama harus berupa string' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  name!: string;

  @IsString({ message: 'Deskripsi harus berupa string' })
  @IsNotEmpty({ message: 'Deskripsi tidak boleh kosong' })
  description!: string;

  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price!: number;

  @IsString({ message: 'Ukuran harus berupa string' })
  @IsNotEmpty({ message: 'Ukuran tidak boleh kosong' })
  size!: string;

  @IsString({ message: 'Kategori harus berupa string' })
  @IsNotEmpty({ message: 'Kategori tidak boleh kosong' })
  category!: string;

  @IsString({ message: 'Kondisi harus berupa string' })
  @IsNotEmpty({ message: 'Kondisi tidak boleh kosong' })
  condition!: string;

  @IsArray({ message: 'Image URLs harus berupa array' })
  @IsString({ each: true, message: 'Setiap URL gambar harus berupa string' })
  imageUrls!: string[];
}

export class UpdateProductDto {
  @IsOptional()
  @IsString({ message: 'Nama harus berupa string' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Deskripsi harus berupa string' })
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Harga harus berupa angka' })
  @Min(0, { message: 'Harga tidak boleh negatif' })
  price?: number;

  @IsOptional()
  @IsString({ message: 'Ukuran harus berupa string' })
  size?: string;

  @IsOptional()
  @IsString({ message: 'Kategori harus berupa string' })
  category?: string;

  @IsOptional()
  @IsString({ message: 'Kondisi harus berupa string' })
  condition?: string;

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Status tidak valid' })
  status?: ProductStatus;

  @IsOptional()
  @IsArray({ message: 'Image URLs harus berupa array' })
  @IsString({ each: true, message: 'Setiap URL gambar harus berupa string' })
  imageUrls?: string[];
}

@ApiTags('Products')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly storageService: StorageService,
  ) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    const url = await this.storageService.uploadFile(file);
    return { url };
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(@Query('status') status?: ProductStatus) {
    return this.productsService.findAll(status);
  }

  @Get('latest')
  findLatest() {
    return this.productsService.findLatest();
  }

  @Get('popular')
  findPopular() {
    return this.productsService.findPopular();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
