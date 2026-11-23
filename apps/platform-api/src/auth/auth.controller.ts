import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { CookieOptions, Request, Response } from "express";
import { AuthService } from "./auth.service";
import { Public } from "./decorators/public.decorator";
import { LoginDto } from "./dto/login.dto";

const REFRESH_COOKIE = "refresh_token";
// Scoped to /api/auth so the cookie is never sent on ordinary API calls —
// only the three endpoints that actually need it (login/refresh/logout).
const REFRESH_COOKIE_PATH = "/api/auth";
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken, user } = await this.authService.login(
      dto.email,
      dto.password,
    );
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    return { accessToken, user };
  }

  // Deliberately reads the refresh token from the httpOnly cookie, never
  // from the request body — a token a browser script could read (and thus
  // put in a JSON body) shouldn't be trusted as the long-lived credential.
  // See SUPSEAL_Technical_Plan Section 4 / the brand-admin & super-admin
  // portal build: this is what makes admin sessions resistant to XSS token
  // theft in a way a body-based refresh token wouldn't be.
  @Public()
  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException("No refresh token");
    }
    const { accessToken, refreshToken, user } = await this.authService.refresh(token);
    res.cookie(REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    return { accessToken, user };
  }

  @Public()
  @Post("logout")
  @HttpCode(HttpStatus.OK)
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (token) {
      await this.authService.logout(token);
    }
    res.clearCookie(REFRESH_COOKIE, { path: REFRESH_COOKIE_PATH });
    return { success: true };
  }
}
