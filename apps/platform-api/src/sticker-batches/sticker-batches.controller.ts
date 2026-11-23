import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Res,
} from "@nestjs/common";
import { UserRole } from "@supseal/database";
import type { Response } from "express";
import { existsSync } from "fs";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Roles } from "../auth/decorators/roles.decorator";
import { JwtPayload } from "../auth/jwt-payload";
import { CreateBatchDto } from "./dto/create-batch.dto";
import { ReconcileBatchDto } from "./dto/reconcile-batch.dto";
import { StickerBatchesService } from "./sticker-batches.service";

function requireBrandId(user: JwtPayload): string {
  if (!user.brandId) throw new ForbiddenException("Account is not scoped to a brand");
  return user.brandId;
}

@Controller("batches")
export class StickerBatchesController {
  constructor(private readonly batchesService: StickerBatchesService) {}

  // Shared path, role-branched: Super Admin sees the platform-wide queue
  // (optionally filtered by ?status= and/or ?printRequested=true for the
  // print-fulfillment queue), Brand Admin/Staff see their own brand's
  // batches only (RLS-enforced regardless of this branch).
  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get()
  list(
    @CurrentUser() user: JwtPayload,
    @Query("status") status?: string,
    @Query("printRequested") printRequested?: string,
  ) {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.batchesService.listAll({
        status,
        printRequested: printRequested === undefined ? undefined : printRequested === "true",
      });
    }
    return this.batchesService.list(requireBrandId(user));
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get(":id")
  getOne(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    if (user.role === UserRole.SUPER_ADMIN) {
      return this.batchesService.getOneAsSuperAdmin(id);
    }
    return this.batchesService.getOne(requireBrandId(user), id);
  }

  // Brand-initiated, no approval gate — codes + PDF generate in the
  // background (see BatchQueueService). See CreateBatchDto for the
  // printRequested "ask SUPSEAL to print for us" option.
  @Roles(UserRole.BRAND_ADMIN)
  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateBatchDto) {
    return this.batchesService.create(requireBrandId(user), user.sub, dto);
  }

  @Roles(UserRole.SUPER_ADMIN, UserRole.BRAND_ADMIN, UserRole.BRAND_STAFF)
  @Get(":id/pdf")
  async downloadPdf(
    @CurrentUser() user: JwtPayload,
    @Param("id") id: string,
    @Res() res: Response,
  ) {
    const path =
      user.role === UserRole.SUPER_ADMIN
        ? await this.batchesService.getPdfPathForSuperAdmin(id)
        : await this.batchesService.getPdfPathForBrand(requireBrandId(user), id);

    if (!existsSync(path)) {
      throw new NotFoundException("PDF file is missing on the server — contact support");
    }
    res.download(path, `supseal-batch-${id}.pdf`);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/send-to-print")
  sendToPrint(@Param("id") id: string) {
    return this.batchesService.advance(id, "SENT_TO_PRINT");
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/ship")
  ship(@Param("id") id: string) {
    return this.batchesService.advance(id, "SHIPPED");
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/deliver")
  deliver(@Param("id") id: string) {
    return this.batchesService.advance(id, "DELIVERED");
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/reconcile")
  reconcile(@Param("id") id: string, @Body() dto: ReconcileBatchDto) {
    return this.batchesService.reconcile(id, dto);
  }

  @Roles(UserRole.SUPER_ADMIN)
  @Patch(":id/revoke")
  revoke(@CurrentUser() user: JwtPayload, @Param("id") id: string) {
    return this.batchesService.revoke(id, user.sub);
  }
}
