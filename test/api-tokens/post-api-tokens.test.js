/*global describe, it, after, before*/

const request = require('supertest')
const { app } = require('../../src/index')
const assert = require('assert')
const { ProjectPermission, App, AccessToken, Client, ClientPermission } = require('../../src/services/db/Db')
const { getAuth } = require('../helpers/getAuth')
const randomstring = require('randomstring')
const { getProject } = require('../helpers/getProject')
const { getProjectPermission } = require('../helpers/getProjectPermission')

let auth
let project
let userProjectPermission
let resApiToken
const reqApiToken = { name: randomstring.generate() }

describe('POST /projects', () => {
  before(async () => {
    auth = await getAuth()
    project = await getProject()
    userProjectPermission = await getProjectPermission(auth, project)
  })

  it('should return 200', done => {
    request(app)
      .post(`/projects/${project.project.id}/api-tokens`)
      .set('AccessToken', auth.accessToken.token)
      .send(reqApiToken)
      .expect(200)
      .expect(res => {
        const { id, name, token, ...rest } = res.body
        assert.equal(name, reqApiToken.name)
        assert.equal(id.length, 24)
        assert.equal(token.length, 40)
        assert.deepEqual(rest, {})
        resApiToken = res.body
      })
      .end(done)
  })

  it('should return 400', done => {
    request(app)
      .post(`/projects/${project.project.id}/api-tokens`)
      .set('AccessToken', auth.accessToken.token)
      .send({ n: 'post-projects-fail' })
      .expect(400, { message: 'Missing required property: name' })
      .end(done)
  })

  after(async () => {
    const { app, client, clientPermission, projectPermission, accessToken } = await (async () => {
      const app = await App.findOne({ name: reqApiToken.name })
      const client = await Client.findOne({ type: 'app', clientSourceId: app.id })
      const clientPermission = await ClientPermission.findOne({ clientId: client.id })
      const projectPermission = await ProjectPermission.findOne({ clientId: client.id })
      const accessToken = await AccessToken.findOne({ clientId: client.id })
      return { app, client, clientPermission, projectPermission, accessToken }
    })()

    await AccessToken.remove(accessToken.id)
    await ProjectPermission.remove(projectPermission.id)
    await App.remove(app.id)
    await userProjectPermission.remove()
    await project.remove()
    await auth.remove()

    {
      const { id, name, ...rest } = app
      assert.equal(id.toString(), resApiToken.id)
      assert.deepEqual(rest, {})
    }

    {
      const { id, type, clientSourceId, ...rest } = client
      assert.deepEqual(rest, {})
    }

    {
      const {
        id,
        clientId,
        projectCreate,
        projectRead,
        projectUpdate,
        projectDelete,
        apiTokenCreate,
        apiTokenRead,
        apiTokenUpdate,
        apiTokenDelete,
        ...rest
      } = clientPermission
      assert.equal(projectCreate, false)
      assert.equal(projectRead, false)
      assert.equal(projectUpdate, false)
      assert.equal(projectDelete, false)
      assert.equal(apiTokenCreate, false)
      assert.equal(apiTokenRead, false)
      assert.equal(apiTokenUpdate, false)
      assert.equal(apiTokenDelete, false)
      assert.deepEqual(rest, {})
    }

    {
      const {
        id,
        projectId,
        clientId,
        projectRead,
        projectUpdate,
        projectDelete,
        apiTokenCreate,
        apiTokenRead,
        apiTokenUpdate,
        apiTokenDelete,
        ...rest
      } = projectPermission
      assert.equal(projectId.toString(), project.project.id.toString())
      assert.equal(projectRead, false)
      assert.equal(projectUpdate, false)
      assert.equal(projectDelete, false)
      assert.equal(apiTokenCreate, false)
      assert.equal(apiTokenRead, false)
      assert.equal(apiTokenUpdate, false)
      assert.equal(apiTokenDelete, false)
      assert.deepEqual(rest, {})
    }

    {
      const { id, clientId, token, ...rest } = accessToken
      assert.equal(token, resApiToken.token)
      assert.deepEqual(rest, {})
    }
  })
})
