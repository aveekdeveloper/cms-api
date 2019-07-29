/*global describe, it, before, after*/

const { request } = require('../helpers/request')
const { getAuth } = require('../helpers/getAuth')
const { routes } = require('./routes')
const { unvalidId, routeDesc, routeParams } = require('./params')

describe('Extract projectId', () => {
  let auth

  before(async () => {
    auth = await getAuth()
  })

  routes.forEach(({ route, methods }) => {
    methods.forEach(({ method, tests }) => {
      if (!tests.extractProjectId) return
      it(`${method.toUpperCase()} ${route(routeDesc)}`, done => {
        Promise.all([
          request[method](route({ ...routeParams, projectId: unvalidId }))
            .set('AccessToken', auth.accessToken.token)
            .expect(404, { message: 'ProjectId is not valid' }),
          request[method](route({ ...routeParams }))
            .set('AccessToken', auth.accessToken.token)
            .expect(404, { message: 'Project not found' }),
        ])
          .then(() => done())
          .catch(done)
      })
    })
  })

  after(async () => {
    await auth.remove()
  })
})