"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CarService = class CarService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCar(data) {
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
    async getCar(id) {
        const car = await this.prisma.car.findUnique({
            where: { id },
            include: { lotteries: true },
        });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        return car;
    }
    async listCars(params) {
        const where = {};
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
    async updateCar(id, data) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        const activeLottery = await this.prisma.lottery.findFirst({
            where: {
                carId: id,
                status: { in: [client_1.LotteryStatus.ACTIVE, client_1.LotteryStatus.SPINNING] },
            },
        });
        if (activeLottery && (data.isAvailable === false || data.price !== undefined)) {
            throw new common_1.ForbiddenException('Cannot modify car details while an active lottery exists');
        }
        return this.prisma.car.update({
            where: { id },
            data,
        });
    }
    async deleteCar(id) {
        const car = await this.prisma.car.findUnique({ where: { id } });
        if (!car) {
            throw new common_1.NotFoundException('Car not found');
        }
        const lottery = await this.prisma.lottery.findFirst({
            where: { carId: id },
        });
        if (lottery) {
            throw new common_1.ForbiddenException('Cannot delete car that is associated with a lottery');
        }
        return this.prisma.car.delete({ where: { id } });
    }
};
exports.CarService = CarService;
exports.CarService = CarService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CarService);
//# sourceMappingURL=car.service.js.map