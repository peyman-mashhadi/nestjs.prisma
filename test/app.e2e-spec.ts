/* eslint-disable max-len */
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const testUser = {
    email: 'test.e2e@gmail.com',
    password: 'Test12345678',
    name: 'e2eTest',
  };
  const admin = {
    email: 'peyman.mashhadi@gmail.com',
    password: 'Peyman12345678',
  };
  let adminId: number;
  let testUserId: number;
  let adminToken: string;
  let testUserToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
  });

  it('/api/_health (GET)', () => {
    return request(app.getHttpServer()).get('/api/_health').expect(200).expect('OK');
  });

  describe('/user (POST)', () => {
    it('Should create test user (public route)', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send(testUser)
        .then((data) => {
          const user = JSON.parse(data.text);
          testUserId = user.id;
          expect(user).toHaveProperty('is_admin', false);
          expect(user).toHaveProperty('id');
        });
    });

    it('Should not creat user if the password is weak', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send({ email: 'weakPas@gmail.com', password: '1234' })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.message[0]).toEqual(
            'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
          );
        });
    });

    it('Should not creat user if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send({ email: 'Invalidgmail.com', password: 'test' })
        .then((data) => {
          const res = JSON.parse(data.text);
          expect(res.message[0]).toEqual('email must be an email');
        });
    });

    it('Should not creat user if email or password are invalid, and should return all validation errors', () => {
      return request(app.getHttpServer())
        .post('/user')
        .send({ email: 'Invalidgmail.com', password: 'test' })
        .then((data) => {
          const res = JSON.parse(data.text);
          expect(res.message).toEqual([
            'email must be an email',
            'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
          ]);
        });
    });
  });

  describe('/user/token (POST)', () => {
    it('Should retern jwt token for admin', () => {
      return request(app.getHttpServer())
        .post('/user/token')
        .send({ email: admin.email, password: admin.password })
        .then((data) => {
          const result = JSON.parse(data.text);
          adminToken = result.token;
          expect(result).toHaveProperty('token');
          expect(result.token).toContain('eyJ');
        });
    });

    it('Should retern jwt token for normal user (testUser)', () => {
      return request(app.getHttpServer())
        .post('/user/token')
        .send({ email: testUser.email, password: testUser.password })
        .then((data) => {
          const result = JSON.parse(data.text);
          testUserToken = result.token;
          expect(result).toHaveProperty('token');
          expect(result.token).toContain('eyJ');
        });
    });

    it('Should retern error if the email and password are wrong', () => {
      return request(app.getHttpServer())
        .post('/user/token')
        .send({ email: testUser.email, password: 'wrongPass' })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('message', 'Please check your login credentials');
        });
    });
  });

  describe('/user/authenticate (POST)', () => {
    it('Should authenticate testUser and return true when email and password are correect', () => {
      return request(app.getHttpServer())
        .post('/user/authenticate')
        .send({ email: testUser.email, password: testUser.password })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toEqual(true);
        });
    });

    it('Should not authenticate testUser and throw error if email or passwrod are not correct', () => {
      return request(app.getHttpServer())
        .post('/user/authenticate')
        .send({ email: testUser.email, password: '1234' })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.message).toEqual('Please check your login credentials');
        });
    });
  });

  describe('/user/validate', () => {
    it('Should validate userToken and return jwt payload', () => {
      return request(app.getHttpServer())
        .post('/user/validate')
        .set('Authorization', `Bearer ${testUserToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.username).toEqual('test.e2e@gmail.com');
          expect(result.id).toEqual(testUserId);
        });
    });

    it('Should validate adminToken and return jwt payload', () => {
      return request(app.getHttpServer())
        .post('/user/validate')
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          adminId = result.id;
          expect(result.username).toEqual('peyman.mashhadi@gmail.com');
        });
    });

    it('Should throw error if token is malformed', () => {
      return request(app.getHttpServer())
        .post('/user/validate')
        .set('Authorization', `Bearer invalidToken`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.message).toEqual('Please check your login credentials');
        });
    });

    it('Should throw error if token is invalid', () => {
      return request(app.getHttpServer())
        .post('/user/validate')
        .set(
          'Authorization',
          `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c`,
        )
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.message).toEqual('Please check your login credentials');
        });
    });
  });

  describe('/user/:id (GET)', () => {
    it('Should find only current user if the token is valid', () => {
      return request(app.getHttpServer())
        .get(`/user/${testUserId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .then((data) => {
          const user = JSON.parse(data.text);
          expect(user).toHaveProperty('id', testUserId);
          expect(user).toHaveProperty('name', testUser.name);
        });
    });

    it('Should ignore finding other users if the token is not for admin', () => {
      return request(app.getHttpServer())
        .get(`/user/${adminId}`)
        .set('Authorization', `Bearer ${testUserToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('message', 'You can not see other users');
        });
    });

    it('Should find other users if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('name', testUser.name);
        });
    });
  });

  describe('/user (GET)', () => {
    it('Should get all the users if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.length).toBeGreaterThan(1);
          expect(result[0]).not.toHaveProperty('credentials');
        });
    });

    it('Should return all the users with credetials if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user?includeCredentials=true`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result.length).toBeGreaterThan(1);
          expect(result[0]).toHaveProperty('credentials');
          expect(result[0].credentials).toHaveProperty('hash');
          expect(result[0].credentials).toHaveProperty('id');
        });
    });

    it('Should get the first 2 users with their credetials if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user?includeCredentials=true&limit=2`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result[0]).toHaveProperty('id', adminId);
          expect(result[0]).toHaveProperty('credentials');
          expect(result).toHaveLength(2);
        });
    });

    it('Should get 1 user with its credetials if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user?includeCredentials=true&offset=1&limit=1`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result[0]).toHaveProperty('credentials');
          expect(result).toHaveLength(1);
        });
    });

    it('Should get 1 user (name LIKE test) without credetials if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user?name=test`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result[0]).not.toHaveProperty('credentials');
          expect(result).toHaveLength(1);
          expect(result[0]).toHaveProperty('name', 'e2eTest');
        });
    });

    it('Should get 1 user (email matches test.e2e@gmail.com) if the token is for admin', () => {
      return request(app.getHttpServer())
        .get(`/user?email=test.e2e@gmail.com`)
        .set('Authorization', `Bearer ${adminToken}`)
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result[0]).not.toHaveProperty('credentials');
          expect(result).toHaveLength(1);
          expect(result[0]).toHaveProperty('name', 'e2eTest');
        });
    });
  });

  describe('/user (PATCH)', () => {
    it('Should udate any user and return updated user if the token is for admin', () => {
      return request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: testUserId, name: 'new e2eTest' })
        .then((data) => {
          const res = JSON.parse(data.text);
          expect(res.name).toEqual('new e2eTest');
        });
    });

    it('Should not be able to update any user if the authentication for admin fails', () => {
      return request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: testUserId, password: 'test' })
        .then((data) => {
          const res = JSON.parse(data.text);
          expect(res.message[0]).toEqual(
            'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
          );
        });
    });

    it('Should update own user even if the authentication is not for admin', () => {
      return request(app.getHttpServer())
        .patch('/user')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ id: testUserId, name: 'my own e2eTst name' })
        .then((data) => {
          const user = JSON.parse(data.text);
          expect(user.name).toEqual('my own e2eTst name');
        });
    });
  });

  describe('/user (DELETE)', () => {
    it('Should not be able to delete other users if the token is not for admin', () => {
      return request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ id: 3 })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('message', 'You can not delete other users');
        });
    });

    it('Should not be able to hard delete own user', () => {
      return request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ id: testUserId, hard: true })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('message', 'You can not hard delete your own user');
        });
    });

    it('Should be able to delete own user if the authentication is valid', () => {
      return request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${testUserToken}`)
        .send({ id: testUserId })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('name', '(deleted)');
          expect(result).toHaveProperty('email', null);
        });
    });

    it('Should hard delete user and return deleted if the token is for admin', () => {
      return request(app.getHttpServer())
        .delete('/user')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ id: testUserId, hard: true })
        .then((data) => {
          const result = JSON.parse(data.text);
          expect(result).toHaveProperty('name', '(deleted)');
          expect(result).toHaveProperty('email', null);
        });
    });
  });
});
