import { Controller, Get, Post, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { CarService } from './car.service';
import { RequirePermissions } from '../common/guards/permissions.guard';
import { CurrentUser } from '../common/guards/jwt-auth.guard';

@Controller('cars')
export class CarController {
  constructor(private readonly carService: CarService) {}

  @Post()
  @RequirePermissions('lottery.manage')
  async createCar(@Body() data: any, @CurrentUser('id') userId: string) {
    return this.carService.createCar(data);
  }

  @Get()
  async listCars(
    @Query('isAvailable') isAvailable?: string,
    @Query('skip') skip?: string,
    @Query('take') take?: string,
  ) {
    return this.carService.listCars({
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      skip: skip ? parseInt(skip) : undefined,
      take: take ? parseInt(take) : undefined,
    });
  }

  @Get(':id')
  async getCar(@Param('id') id: string) {
    return this.carService.getCar(id);
  }

  @Patch(':id')
  @RequirePermissions('lottery.manage')
  async updateCar(@Param('id') id: string, @Body() data: any) {
    return this.carService.updateCar(id, data);
  }

  @Delete(':id')
  @RequirePermissions('lottery.manage')
  async deleteCar(@Param('id') id: string) {
    return this.carService.deleteCar(id);
  }
}
