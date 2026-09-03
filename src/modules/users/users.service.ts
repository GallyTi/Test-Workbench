import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        teamsUserId: true,
        slovnaftId: true,
        phoneNumber: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findPending() {
    return this.prisma.user.findMany({
      where: { isApproved: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        teamsUserId: true,
        slovnaftId: true,
        phoneNumber: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        teamsUserId: true,
        slovnaftId: true,
        phoneNumber: true,
        isApproved: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Používateľ nebol nájdený');
    }
    return user;
  }

  async approveUser(id: string, role?: UserRole) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        role: role || undefined,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        isApproved: true,
        isActive: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        avatarUrl: true,
        teamsUserId: true,
        slovnaftId: true,
        phoneNumber: true,
        isApproved: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    await this.findOne(id);
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
