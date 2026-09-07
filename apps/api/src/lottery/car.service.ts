import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Car, LotteryStatus } from '@prisma/client';

@Injectable()
export class CarService {
  constructor(private readonly prisma: PrismaService) {}

  async createCar(data: {
    name: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
    price: number;
    currency?: string;
    images?: string[];
    description?: string;
    specs?: any;
  }): Promise<Car> {
    return this.prisma.car.create({
      data: {
        name: data.name,
        brand: data.brand,
        model: data.model,
        year: data.year,
        color: data.color,
        price: data.price,
        currency: data.currency || 'ETB',
        images: data.images || [],
        description: data.description,
        specs: data.specs,
      },
    });
  }

  async getCar(id: string): Promise<Car> {
    const car = await this.prisma.car.findUnique({
      where: { id },
      include: { lotteries: true },
    });

    if (!car) {
      throw new NotFoundException('Car not found');
    }

    return car;
  }

  async listCars(params?: {
    isAvailable?: boolean;
    skip?: number;
    take?: number;
  }): Promise<{ cars: Car[]; total: number }> {
    const where: any = {};
    if (params?.isAvailable !== undefined) {
      where.isAvailable = params.isAvailable;
    }

    const [cars, total] = await Promise.all([
      this.prisma.car.findMany({
        where,
        skip: params?.skip || 0,
        take: params?.take || 20,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.car.count({ where }),
    ]);

    return { cars, total };
  }

  async updateCar(
    id: string,
    data: {
      name?: string;
      brand?: string;
      model?: string;
      year?: number;
      color?: string;
      price?: number;
      currency?: string;
      images?: string[];
      description?: string;
      specs?: any;
      isAvailable?: boolean;
    },
  ): Promise<Car> {
    const car = await this.prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Check if car is used in an active lottery
    const activeLottery = await this.prisma.lottery.findFirst({
      where: {
        carId: id,
        status: { in: [LotteryStatus.ACTIVE, LotteryStatus.SPINNING] },
      },
    });

    if (activeLottery && (data.isAvailable === false || data.price !== undefined)) {
      throw new ForbiddenException('Cannot modify car details while an active lottery exists');
    }

    return this.prisma.car.update({
      where: { id },
      data,
    });
  }

  async deleteCar(id: string): Promise<Car> {
    const car = await this.prisma.car.findUnique({ where: { id } });
    if (!car) {
      throw new NotFoundException('Car not found');
    }

    // Check if car is used in any lottery
    const lottery = await this.prisma.lottery.findFirst({
      where: { carId: id },
    });

    if (lottery) {
      throw new ForbiddenException('Cannot delete car that is associated with a lottery');
    }

    return this.prisma.car.delete({ where: { id } });
  }
}
