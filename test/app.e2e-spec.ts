import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  const testUser = {
    email: 'test.ma@gmail.com',
    password: 'Test12345678',
    name: 'e2eTest',
  };
  const admin = {
    email: 'peyman.mashhadi@gmail.com',
    password: 'Peyman12345678',
  };
  let admin_id;
  let testUserId;
  let adminToken;
  let testUserToken;

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

  it('Should create test user', () => {
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

  it('Should not creat user because of weak password', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({ email: 'weakPas1@gmail.com', password: '1234' })
      .then((data) => {
        const result = JSON.parse(data.text);
        console.log(result);
        expect(result.message[0]).toEqual(
          'Password should contain at least 1 upper case letter, 1 lower case letter and 1 number or special character',
        );
      });
  });

  it('Should not creat user because of invalid email', () => {
    return request(app.getHttpServer())
      .post('/user')
      .send({ email: 'Invalidgmail.com', password: 'test' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.message[0]).toEqual('email must be an email');
      });
  });

  it('Should authenticate admin and return jwt', () => {
    return request(app.getHttpServer())
      .post('/user/token')
      .send({ email: admin.email, password: admin.password })
      .then((data) => {
        const result = JSON.parse(data.text);
        adminToken = result.token;
        expect(result).toHaveProperty('token');
      });
  });

  it('Should authenticate testUser and return jwt', () => {
    return request(app.getHttpServer())
      .post('/user/token')
      .send({ email: testUser.email, password: testUser.password })
      .then((data) => {
        const result = JSON.parse(data.text);
        testUserToken = result.token;
        expect(result).toHaveProperty('token');
      });
  });

  it('Should authenticate testUser and return true', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: testUser.email, password: testUser.password })
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result).toEqual(true);
      });
  });

  it('Should not authenticate testUser and throw error', () => {
    return request(app.getHttpServer())
      .post('/user/authenticate')
      .send({ email: testUser.email, password: '1234' })
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result.message).toEqual('Please check your login credentials');
      });
  });

  it('Should validate test userToken and return jwt payload', () => {
    return request(app.getHttpServer())
      .post('/user/validate')
      .set('Authorization', `Bearer ${testUserToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result.username).toEqual('test.ma@gmail.com');
      });
  });

  it('Should authenticate test adminToken and return jwt payload', () => {
    return request(app.getHttpServer())
      .post('/user/validate')
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        admin_id = result.id;
        expect(result.username).toEqual('peyman.mashhadi@gmail.com');
      });
  });

  it('Should authenticate test user and return test user', () => {
    return request(app.getHttpServer())
      .get(`/user/${testUserId}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .then((data) => {
        expect(JSON.parse(data.text)).toHaveProperty('id', testUserId);
      });
  });

  it('Should authenticate test user but does not return admin user', () => {
    return request(app.getHttpServer())
      .get(`/user/${admin_id}`)
      .set('Authorization', `Bearer ${testUserToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result).toHaveProperty('message', 'You can not see other users');
      });
  });

  it('Should authenticate admin and return all the users', () => {
    return request(app.getHttpServer())
      .get(`/user`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).toHaveProperty('id', admin_id);
        expect(result[0]).not.toHaveProperty('credentials');
      });
  });

  it('Should authenticate admin and return all the users with credetials', () => {
    return request(app.getHttpServer())
      .get(`/user?includeCredentials=true`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).toHaveProperty('id', admin_id);
        expect(result[0]).toHaveProperty('credentials');
      });
  });

  it('Should authenticate admin and return 2 users with credetials', () => {
    return request(app.getHttpServer())
      .get(`/user?includeCredentials=true&limit=2`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).toHaveProperty('id', admin_id);
        expect(result[0]).toHaveProperty('credentials');
        expect(result).toHaveLength(2);
      });
  });

  it('Should authenticate admin and return 1 user with credetials', () => {
    return request(app.getHttpServer())
      .get(`/user?includeCredentials=true&offset=1&limit=1`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).toHaveProperty('credentials');
        expect(result).toHaveLength(1);
      });
  });

  it('Should authenticate admin and return 1 user (name Like bahra) without credetials', () => {
    return request(app.getHttpServer())
      .get(`/user?name=bahra`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).not.toHaveProperty('credentials');
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('name', 'bahram');
      });
  });

  it('Should authenticate admin and return 1 user (email: bahram.ma@gmail.com) with credetials', () => {
    return request(app.getHttpServer())
      .get(`/user?email=bahram.ma@gmail.com`)
      .set('Authorization', `Bearer ${adminToken}`)
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result[0]).not.toHaveProperty('credentials');
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('name', 'bahram');
      });
  });

  it('Should authenticate admin and return updated test user', () => {
    return request(app.getHttpServer())
      .patch('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: testUserId, name: 'test' })
      .then((data) => {
        const res = JSON.parse(data.text);
        expect(res.name).toEqual('test');
      });
  });

  it('Should authenticate admin and return updated test user', () => {
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

  it('Should authenticate admin and return deleted user', () => {
    return request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: testUserId })
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result).toHaveProperty('name', '(deleted)');
        expect(result).toHaveProperty('email', null);
      });
  });

  it('Should authenticate admin and return hard deleted test user', () => {
    return request(app.getHttpServer())
      .delete('/user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: testUserId, hard_delete: true })
      .then((data) => {
        const result = JSON.parse(data.text);
        expect(result).toHaveProperty('name', '(deleted)');
        expect(result).toHaveProperty('email', null);
      });
  });
});
