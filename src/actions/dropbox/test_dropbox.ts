import * as b64 from "base64-url"
import * as chai from "chai"
import * as gaxios from "gaxios"
import * as https from "request-promise-native"
import * as sinon from "sinon"

import * as Hub from "../../hub"

import {ActionCrypto} from "../../hub"
import { DropboxAction } from "./dropbox"

const action = new DropboxAction()

const stubFileName = "stubSuggestedFilename"
const stubDirectory = "stubSuggestedDirectory"

async function expectDropboxMatch(request: Hub.ActionRequest, optionsMatch: any): Promise<any> {

  const fileUploadSpy = sinon.spy(async (_path: string, _contents: any) => Promise.resolve({}))

  const stubClient = sinon.stub(action as any, "dropboxClientFromRequest")
    .callsFake(() => ({
      filesUpload: fileUploadSpy,
    }))

  try {
    await action.execute(request)
    chai.expect(fileUploadSpy).to.have.been.calledWithMatch(optionsMatch)
  } finally {
    stubClient.restore()
  }
}

describe(`${action.constructor.name} unit tests`, () => {
  let sandbox: sinon.SinonSandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    sandbox.stub(ActionCrypto.prototype, "encrypt").callsFake( async (s: string) => b64.encode(s) )
    sandbox.stub(ActionCrypto.prototype, "decrypt").callsFake( async (s: string) => b64.decode(s) )
    process.env.DROPBOX_ACTION_APP_KEY = "testingkey"
    process.env.DROPBOX_ACTION_APP_SECRET = "testingsecret"
  })

  afterEach(() => {
    sandbox.restore()
    delete process.env.DROPBOX_ACTION_APP_KEY
    delete process.env.DROPBOX_ACTION_APP_SECRET
  })

  describe("action", () => {

    it("has streaming disabled to support legacy schedules", () => {
      chai.expect(action.usesStreaming).equals(false)
    })

    it("successfully interprets unencrypted execute request params", async () => {
      const request = new Hub.ActionRequest()
      request.attachment = {dataBuffer: Buffer.from("Hello"), fileExtension: "csv"}
      request.formParams = {filename: stubFileName, directory: stubDirectory}
      request.params = {
        state_url: "https://looker.state.url.com/action_hub_state/asdfasdfasdfasdf",
        state_json: `{"access_token": "token"}`,
      }
      const encryptSpy = sandbox.spy(action as any, "oauthExtractTokensFromStateJson")
      await expectDropboxMatch(request,
        {path: `/${stubDirectory}/${stubFileName}.csv`, contents: Buffer.from("Hello")})
      chai.expect(encryptSpy).to.not.have.been.called
    })

    it("sets state to reset if error in fileUpload", async () => {
      const request = new Hub.ActionRequest()
      request.attachment = {dataBuffer: Buffer.from("Hello"), fileExtension: "csv"}
      request.formParams = {filename: stubFileName, directory: stubDirectory}
      request.type = Hub.ActionType.Query
      request.params = {
        state_url: "https://looker.state.url.com/action_hub_state/asdfasdfasdfasdf",
        state_json: `{"access_token": "token"}`,
      }
      sandbox.stub(action as any, "dropboxClientFromRequest")
        .callsFake(() => ({
          filesUpload: async () => Promise.reject("reject"),
        }))
      const resp = await action.validateAndExecute(request)
      chai.expect(resp).to.deep.equal({
        success: false,
        state: {data: "reset"},
        refreshQuery: false,
        validationErrors: [],
      })
    })
    it("uses oauthExtractTokensFromStateJson to decrypt state", async () => {
      const stubDecrypt = sandbox.stub(action as any, "oauthExtractTokensFromStateJson").resolves({access_token: "decrypted_token"})
      const request = new Hub.ActionRequest()
      request.params = { state_json: `{"cid": "123", "payload": "encrypted_payload"}` }
      request.attachment = {dataBuffer: Buffer.from("Hello"), fileExtension: "csv"}
      request.formParams = {filename: stubFileName, directory: stubDirectory}

      await expectDropboxMatch(request, {
        path: `/${stubDirectory}/${stubFileName}.csv`,
        contents: Buffer.from("Hello"),
      })
      chai.expect(stubDecrypt).to.have.been.calledWith(
        `{"cid": "123", "payload": "encrypted_payload"}`,
        request.webhookId,
      )
    })
  })

  describe("form", () => {
    it("has form", () => {
      chai.expect(action.hasForm).equals(true)
    })

    it("returns an oauth form on bad login", async () => {
      sandbox.stub(action as any, "dropboxClientFromRequest")
        .callsFake(() => ({
          filesListFolder: async (_: any) => Promise.reject("haha I failed auth"),
        }))
      const request = new Hub.ActionRequest()
      request.params = {
        state_url: "https://looker.state.url.com/action_hub_state/asdfasdfasdfasdf",
        state_json: `{"access_token": "token"}`,
      }
      const form = await action.validateAndFetchForm(request)
      chai.expect(form).to.deep.equal({
        fields: [{
          name: "login",
          type: "oauth_link",
          description: "In order to send to a Dropbox file or folder now and in the future, you will need to log " +
            "in once to your Dropbox account.",
          label: "Log in",
          oauth_url: `${process.env.ACTION_HUB_BASE_URL}/actions/dropbox/oauth?state=eyJzdGF0ZXVybCI6Imh0dHBzOi8vbG9` +
          `va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0ZS9hc2RmYXNkZmFzZGZhc2RmIn0`,
        }],
        state: {},
      })
    })

    it("does not blow up on bad state JSON and returns an OAUTH form", async () => {
      sandbox.stub(action as any, "dropboxClientFromRequest")
        .callsFake(() => ({
          filesListFolder: async (_: any) => Promise.reject("haha I failed auth"),
        }))
      const request = new Hub.ActionRequest()
      request.params = {
        state_url: "https://looker.state.url.com/action_hub_state/asdfasdfasdfasdf",
        state_json: `{"access_token": "token"}`,
      }
      const encryptSpy = sandbox.spy(action as any, "oauthExtractTokensFromStateJson")
      const form = await action.validateAndFetchForm(request)
      chai.expect(encryptSpy).to.not.have.been.called
      chai.expect(form).to.deep.equal({
        fields: [{
          name: "login",
          type: "oauth_link",
          description: "In order to send to a Dropbox file or folder now and in the future, you will need to log " +
            "in once to your Dropbox account.",
          label: "Log in",
          oauth_url: `${process.env.ACTION_HUB_BASE_URL}/actions/dropbox/oauth?state=eyJzdGF0ZXVybCI6` +
            `Imh0dHBzOi8vbG9va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0ZS9hc2RmYXNkZmFzZGZhc2RmIn0`,
        }],
        state: {},
      })
    })

    it("returns correct fields on oauth success", async () => {
      sandbox.stub(action as any, "dropboxClientFromRequest")
        .callsFake(() => ({
          filesListFolder: async (_: any) => Promise.resolve({entries: [{
              "name": "fake_name",
              "label": "fake_label",
              ".tag": "folder"}],
          }),
        }))
      const request = new Hub.ActionRequest()
      request.params = {
        appKey: "mykey",
        secretKey: "mySecret",
      }
      const form = await action.validateAndFetchForm(request)
      chai.expect(form).to.deep.equal({
        fields: [{
          default: "__root",
          description: "Dropbox folder where your file will be saved",
          label: "Select folder to save file",
          name: "directory",
          options: [{ name: "__root", label: "Home" }, { name: "fake_name", label: "fake_name" }],
          required: true,
          type: "select",
        }, {
          label: "Enter a name",
          name: "filename",
          type: "string",
          required: true,
        }, {
          label: "Append timestamp",
          name: "includeTimestamp",
          description: "Append timestamp to end of file name. Should be set to 'Yes' if the file will be sent repeatedly",
          required: true,
          default: "no",
          type: "select",
          options: [{
            name: "yes",
            label: "Yes",
          }, {
            name: "no",
            label: "No",
          }],
        }],
      })
    })
  })

  describe("oauth", () => {
    it("returns correct redirect url", () => {
      process.env.DROPBOX_ACTION_APP_KEY = "testingkey"
      const prom = action.oauthUrl("https://actionhub.com/actions/dropbox/oauth_redirect",
        `eyJzdGF0ZXVybCI6Imh0dHBzOi8vbG9va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0ZS9hc2RmYXNkZmFzZGZhc2RmIn0`)
      return chai.expect(prom).to.eventually.equal("https://www.dropbox.com/oauth2/authorize?response_type=code&" +
        "client_id=testingkey&redirect_uri=https%3A%2F%2Factionhub.com%2Factions%2Fdropbox%2Foauth_redirect&" +
        "force_reapprove=true&state=eyJzdGF0ZXVybCI6Imh0dHBzOi8vbG9va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0" +
        "ZS9hc2RmYXNkZmFzZGZhc2RmIn0&token_access_type=offline")
    })

    it("correctly handles redirect from authorization server", async () => {
      // @ts-ignore
      const stubReq = sandbox.stub(https, "post").callsFake(async () => Promise.resolve({access_token: "token"}))
      sandbox.stub(gaxios, "request").resolves({data: {access_token: "token"}} as any)
      await action.oauthFetchInfo({code: "code",
        state: `eyJzdGF0ZXVybCI6Imh0dHBzOi8vbG9va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0ZS9hc2RmYXNkZmFzZGZh` +
          `c2RmIiwiYXBwIjoibXlrZXkifQ`},
        "redirect")
      // The original test didn't have expectations on the post call, just that it finished.
      // We could add one here if needed, e.g., expect(stubReq.calledOnce).to.be.true
    })
    it("uses oauthMaybeEncryptTokens to secure payload", async () => {
      const stubEncrypt = sandbox.stub(action as any, "oauthMaybeEncryptTokens").resolves("encrypted_state")
      // @ts-ignore
      const stubPost = sandbox.stub(https, "post").resolves({})
      sandbox.stub(gaxios, "request").resolves({data: {access_token: "token"}} as any)

      await action.oauthFetchInfo({code: "code", state: `eyJzdGF0ZXVybCI6Imh0dHBzOi8vbG9va2VyLnN0YXRlLnVybC5jb20vYWN0aW9uX2h1Yl9zdGF0ZS9hc2RmYXNkZmFzZGZh` +
        `c2RmIiwiYXBwIjoibXlrZXkifQ`}, "redirect")

      chai.expect(stubEncrypt).to.have.been.calledWithMatch({access_token: "token"})
      chai.expect(stubPost).to.have.been.calledWithMatch({body: "encrypted_state"})
    })
    it("successfully uses body params in getAccessTokenFromCode", async () => {
      const stubRequest = sandbox.stub(gaxios, "request")
        .resolves({data: {access_token: "body_token"}, status: 200} as any)

      // @ts-ignore
      const token = await action.getAccessTokenFromCode({code: "code", redirect: "redirect"})

      chai.expect(token.access_token).to.equal("body_token")
      chai.expect(stubRequest.calledOnce).to.be.true
      chai.expect(stubRequest.calledWithMatch({
        method: "POST",
        headers: {"Content-Type": "application/x-www-form-urlencoded"},
      })).to.be.true
    })
  })

  describe("dropboxFilename", () => {
    it("returns basic filename if includeTimeStamp flag is not set", () => {
      const request = new Hub.ActionRequest()
      request.formParams = {filename: stubFileName, directory: stubDirectory}
      const result = action.dropboxFilename(request)
      chai.expect(result).equal(stubFileName)
    })

    it("returns basic filename if includeTimeStamp flag is no", () => {
      const request = new Hub.ActionRequest()
      request.formParams = {filename: stubFileName, directory: stubDirectory, includeTimestamp: "no"}
      const result = action.dropboxFilename(request)
      chai.expect(result).equal(stubFileName)
    })

    it("returns filename with timestamp if includeTimeStamp flag is yes", () => {
      const request = new Hub.ActionRequest()
      request.formParams = {filename: stubFileName, directory: stubDirectory, includeTimestamp: "yes"}
      const result = action.dropboxFilename(request)
      chai.expect(result).to.include(stubFileName)
      chai.expect(result).not.equal(stubFileName)
    })
  })
})
