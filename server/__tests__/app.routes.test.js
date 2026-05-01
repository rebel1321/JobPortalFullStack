import request from 'supertest'
import { jest, describe, expect, test, beforeEach } from '@jest/globals'

const createResponder = (routeName) =>
  jest.fn((req, res) => {
    res.status(200).json({
      route: routeName,
      body: req.body ?? null,
      params: req.params ?? null,
      company: req.company ?? null,
    })
  })

const routeHandlers = {
  getUserData: createResponder('getUserData'),
  applyForJob: createResponder('applyForJob'),
  getUserJobApplications: createResponder('getUserJobApplications'),
  updateUserResume: createResponder('updateUserResume'),
  getJobs: createResponder('getJobs'),
  getJobById: createResponder('getJobById'),
  registerCompany: createResponder('registerCompany'),
  loginCompany: createResponder('loginCompany'),
  getCompanyData: createResponder('getCompanyData'),
  postJob: createResponder('postJob'),
  getCompanyJobApplicants: createResponder('getCompanyJobApplicants'),
  getCompanyPostedJobs: createResponder('getCompanyPostedJobs'),
  ChangeJobApplicationStatus: createResponder('ChangeJobApplicationStatus'),
  changeVisibility: createResponder('changeVisibility'),
  clerkWebhooks: createResponder('clerkWebhooks'),
}

const protectCompany = jest.fn((req, res, next) => {
  req.company = { _id: 'company-1', name: 'Acme Corp', email: 'acme@example.com' }
  next()
})

const clerkMiddleware = jest.fn(() => (req, res, next) => next())

await jest.unstable_mockModule('../controllers/userController.js', () => ({
  applyForJob: routeHandlers.applyForJob,
  getUserData: routeHandlers.getUserData,
  getUserJobApplications: routeHandlers.getUserJobApplications,
  updateUserResume: routeHandlers.updateUserResume,
}))

await jest.unstable_mockModule('../controllers/jobController.js', () => ({
  getJobById: routeHandlers.getJobById,
  getJobs: routeHandlers.getJobs,
}))

await jest.unstable_mockModule('../controllers/companyController.js', () => ({
  ChangeJobApplicationStatus: routeHandlers.ChangeJobApplicationStatus,
  changeVisibility: routeHandlers.changeVisibility,
  getCompanyData: routeHandlers.getCompanyData,
  getCompanyJobApplicants: routeHandlers.getCompanyJobApplicants,
  getCompanyPostedJobs: routeHandlers.getCompanyPostedJobs,
  loginCompany: routeHandlers.loginCompany,
  postJob: routeHandlers.postJob,
  registerCompany: routeHandlers.registerCompany,
}))

await jest.unstable_mockModule('../controllers/webhooks.js', () => ({
  clerkWebhooks: routeHandlers.clerkWebhooks,
}))

await jest.unstable_mockModule('../middleware/authMiddleware.js', () => ({
  protectCompany,
}))

await jest.unstable_mockModule('@clerk/express', () => ({
  clerkMiddleware,
}))

const { default: app } = await import('../app.js')

beforeEach(() => {
  jest.clearAllMocks()
})

describe('server routes', () => {
  test('GET / returns API status', async () => {
    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.text).toBe('API Working')
  })

  test('GET /debug-sentry returns a server error', async () => {
    const response = await request(app).get('/debug-sentry')

    expect(response.status).toBe(500)
  })

  test('POST /webhooks routes to the webhook handler', async () => {
    const response = await request(app)
      .post('/webhooks')
      .set('svix-id', 'msg_1')
      .set('svix-timestamp', '1710000000')
      .set('svix-signature', 'signature')
      .send({ type: 'user.created', data: { id: 'user_1' } })

    expect(response.status).toBe(200)
    expect(response.body.route).toBe('clerkWebhooks')
    expect(routeHandlers.clerkWebhooks).toHaveBeenCalledTimes(1)
  })

  test.each([
    ['GET', '/api/jobs', 'getJobs'],
    ['GET', '/api/jobs/job-123', 'getJobById'],
    ['GET', '/api/users/user', 'getUserData'],
    ['POST', '/api/users/apply', 'applyForJob'],
    ['GET', '/api/users/applications', 'getUserJobApplications'],
    ['POST', '/api/users/update-resume', 'updateUserResume'],
    ['POST', '/api/company/register', 'registerCompany'],
    ['POST', '/api/company/login', 'loginCompany'],
    ['GET', '/api/company/company', 'getCompanyData'],
    ['POST', '/api/company/post-job', 'postJob'],
    ['GET', '/api/company/applicants', 'getCompanyJobApplicants'],
    ['GET', '/api/company/list-jobs', 'getCompanyPostedJobs'],
    ['POST', '/api/company/change-status', 'ChangeJobApplicationStatus'],
    ['POST', '/api/company/change-visibility', 'changeVisibility'],
  ])('%s %s is wired to %s', async (method, path, routeName) => {
    const requestBuilder = request(app)[method.toLowerCase()](path)

    if (method === 'POST') {
      requestBuilder.send({ id: 'job-1', status: 'Accepted', title: 'Frontend Engineer' })
    }

    const response = await requestBuilder

    expect(response.status).toBe(200)
    expect(response.body.route).toBe(routeName)

    if (path.startsWith('/api/company/') && path !== '/api/company/register' && path !== '/api/company/login') {
      expect(response.body.company).toMatchObject({ _id: 'company-1', name: 'Acme Corp' })
      expect(protectCompany).toHaveBeenCalled()
    }
  })
})