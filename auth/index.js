const BASE_URL = 'https://account.idn.media';
const COGNITO_URL = 'https://cognito-idp.ap-southeast-1.amazonaws.com/';
const CLIENT_ID = '6gnaj30oomhtl0t3qtkfp2uir9';

class IDNAuth {
  constructor() {
    this.tokens = {
      accessToken: null,
      idToken: null,
      refreshToken: null
    };
    this.deviceKey = 'ap-southeast-1_e9b6d680-4931-45b6-837a-e6c9e697b9be';
    console.log('🔐 IDN Auth initialized');
  }

  async login(username, password) {
    try {
      console.log('🔄 Initiating login...');
      
      // First step: USER_SRP_AUTH
      const initialAuth = await fetch(COGNITO_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'x-amz-user-agent': 'aws-amplify/5.0.4 js'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_SRP_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: {
            USERNAME: username,
            SRP_A: "123", // This should be properly calculated
          },
          ClientMetadata: {
            portal: 'idn-media',
            platform: 'desktop-web'
          }
        })
      });

      const authResult = await initialAuth.json();
      
      if (authResult.ChallengeName === 'PASSWORD_VERIFIER') {
        console.log('🔄 Verifying password...');
        const passwordAuth = await fetch(COGNITO_URL, {
          method: 'POST',
          headers: {
            'content-type': 'application/x-amz-json-1.1',
            'x-amz-target': 'AWSCognitoIdentityProviderService.RespondToAuthChallenge'
          },
          body: JSON.stringify({
            ChallengeName: 'PASSWORD_VERIFIER',
            ClientId: CLIENT_ID,
            ChallengeResponses: {
              USERNAME: username,
              PASSWORD: password,
              TIMESTAMP: new Date().toISOString(),
              DEVICE_KEY: this.deviceKey
            },
            Session: authResult.Session
          })
        });

        const passwordAuthResult = await passwordAuth.json();
        
        // Store the tokens
        if (passwordAuthResult.AuthenticationResult) {
          this.tokens = {
            accessToken: passwordAuthResult.AuthenticationResult.AccessToken,
            idToken: passwordAuthResult.AuthenticationResult.IdToken,
            refreshToken: passwordAuthResult.AuthenticationResult.RefreshToken
          };
          console.log('✅ Login successful');
          console.log('🔑 Tokens stored successfully');
          return passwordAuthResult;
        }
      }

      // If we get here without tokens, try direct password auth as fallback
      const directAuth = await fetch(COGNITO_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.InitiateAuth',
          'x-amz-user-agent': 'aws-amplify/5.0.4 js'
        },
        body: JSON.stringify({
          AuthFlow: 'USER_PASSWORD_AUTH',
          ClientId: CLIENT_ID,
          AuthParameters: {
            USERNAME: username,
            PASSWORD: password
          }
        })
      });

      const directAuthResult = await directAuth.json();
      
      if (directAuthResult.AuthenticationResult) {
        this.tokens = {
          accessToken: directAuthResult.AuthenticationResult.AccessToken,
          idToken: directAuthResult.AuthenticationResult.IdToken,
          refreshToken: directAuthResult.AuthenticationResult.RefreshToken
        };
        console.log('✅ Login successful (direct auth)');
        console.log('🔑 Tokens stored successfully');
        return directAuthResult;
      }

      throw new Error('Failed to obtain authentication tokens');
    } catch (error) {
      console.error('❌ Login failed:', error.message);
      throw new Error('Login failed: ' + error.message);
    }
  }

  async getUserInfo() {
    if (!this.tokens.accessToken) {
      console.error('❌ No access token available');
      throw new Error('No access token available. Please login first.');
    }

    try {
      console.log('🔄 Fetching user info...');
      const response = await fetch(COGNITO_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-amz-json-1.1',
          'x-amz-target': 'AWSCognitoIdentityProviderService.GetUser',
          'x-amz-user-agent': 'aws-amplify/5.0.4 js'
        },
        body: JSON.stringify({
          AccessToken: this.tokens.accessToken
        })
      });

      const userData = await response.json();
      return userData;
    } catch (error) {
      console.error('❌ Failed to get user info:', error.message);
      throw new Error('Failed to get user info: ' + error.message);
    }
  }

  isAuthenticated() {
    const authenticated = !!this.tokens.accessToken;
    console.log(authenticated ? '✅ User is authenticated' : '❌ User is not authenticated');
    return authenticated;
  }

  clearTokens() {
    console.log('🔄 Clearing tokens...');
    this.tokens = {
      accessToken: null,
      idToken: null,
      refreshToken: null
    };
    console.log('✅ Tokens cleared');
  }

  async getBalanceInfo() {
    if (!this.tokens.accessToken || !this.tokens.idToken) {
      console.error('❌ No tokens available');
      throw new Error('No tokens available. Please login first.');
    }

    try {
      console.log('🔄 Fetching balance info...');
      const response = await fetch('https://mobile-api.idn.app/v3.1/balance-user', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'access-token': this.tokens.accessToken,
          'authorization': `Bearer ${this.tokens.idToken}`,
          'x-api-key': '1ccc5bc4-8bb4-414c-b524-92d11a85a818',
          'session-id': this.deviceKey,
          'x-request-id': this.deviceKey
        }
      });

      const balanceData = await response.json();
      return balanceData;
    } catch (error) {
      console.error('❌ Failed to get balance info:', error.message);
      throw new Error('Failed to get balance info: ' + error.message);
    }
  }

  async getTierProgress() {
    if (!this.tokens.accessToken || !this.tokens.idToken) {
      console.error('❌ No tokens available');
      throw new Error('No tokens available. Please login first.');
    }

    try {
      console.log('🔄 Fetching tier progress...');
      const response = await fetch('https://api.idn.app/api/v1/tier/progress?n=1', {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'access-token': this.tokens.accessToken,
          'authorization': `Bearer ${this.tokens.idToken}`,
          'x-api-key': '123f4c4e-6ce1-404d-8786-d17e46d65b5c',
          'session-id': this.deviceKey,
          'x-request-id': this.deviceKey
        }
      });

      const tierData = await response.json();
      return tierData;
    } catch (error) {
      console.error('❌ Failed to get tier progress:', error.message);
      throw new Error('Failed to get tier progress: ' + error.message);
    }
  }
}

// Export a singleton instance
const auth = new IDNAuth();
module.exports = auth;
