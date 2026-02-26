export class BlueToken {
  identityId;
  token;
  credentials;
  constructor(
    identity_id : string,
    token : string,
    credentials : BlueCredentials,
  ) {
    this.identityId = identity_id;
    this.token = token;
    this.credentials = credentials;
  }

  /**
   * Decodes the JWT token payload without verifying the signature.
   * Equivalent to jwt-cpp's jwt::decode() call used in Domoticz.
   */
  static decodeJwtPayload(token: string): Record<string, unknown> | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return null;
      }
      const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      // Restore standard base64 padding (base64url omits trailing '=' characters)
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const json = Buffer.from(base64 + padding, 'base64').toString('utf-8');
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  /**
   * Returns the expiration date from the JWT token's `exp` claim.
   * Equivalent to jwt-cpp's decoded.get_expires_at() in Domoticz.
   */
  getTokenExpiration(): Date | null {
    const payload = BlueToken.decodeJwtPayload(this.token);
    if (payload && typeof payload.exp === 'number') {
      return new Date(payload.exp * 1000);
    }
    return null;
  }

  /**
   * Returns the issuer from the JWT token's `iss` claim.
   * Equivalent to jwt-cpp's decoded.get_issuer() in Domoticz.
   */
  getTokenIssuer(): string | null {
    const payload = BlueToken.decodeJwtPayload(this.token);
    if (payload && typeof payload.iss === 'string') {
      return payload.iss;
    }
    return null;
  }
}

export class BlueCredentials {
  access_key : string;
  secret_key : string;
  session_token : string;
  expiration : string;

  constructor(
    access_key : string,
    secret_key: string,
    session_token: string,
    expiration: string,
  ) {
    this.access_key = access_key;
    this.secret_key = secret_key;
    this.session_token = session_token;
    this.expiration = expiration;
  }
}


