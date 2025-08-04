import { getArc56ReturnValue } from '@algorandfoundation/algokit-utils/types/app-arc56';
import { AppClient as _AppClient, } from '@algorandfoundation/algokit-utils/types/app-client';
import { AppFactory as _AppFactory } from '@algorandfoundation/algokit-utils/types/app-factory';
export const APP_SPEC = { "name": "Voto3", "structs": {}, "methods": [{ "name": "inicializar_eleccion", "args": [], "returns": { "type": "void" }, "actions": { "create": [], "call": ["NoOp"] }, "readonly": false, "events": [], "recommendations": {} }, { "name": "registrar_compromiso", "args": [], "returns": { "type": "void" }, "actions": { "create": [], "call": ["NoOp"] }, "readonly": false, "events": [], "recommendations": {} }], "arcs": [22, 28], "networks": {}, "state": { "schema": { "global": { "ints": 2, "bytes": 0 }, "local": { "ints": 0, "bytes": 0 } }, "keys": { "global": { "compromisos_registrados": { "keyType": "AVMString", "valueType": "AVMUint64", "key": "Y29tcHJvbWlzb3NfcmVnaXN0cmFkb3M=" }, "asset_id": { "keyType": "AVMString", "valueType": "AVMUint64", "key": "YXNzZXRfaWQ=" } }, "local": {}, "box": {} }, "maps": { "global": {}, "local": {}, "box": {} } }, "bareActions": { "create": ["NoOp"], "call": [] }, "sourceInfo": { "approval": { "sourceInfo": [{ "pc": [82, 94], "errorMessage": "OnCompletion is not NoOp" }, { "pc": [119], "errorMessage": "Solo el creador puede inicializar la elección" }, { "pc": [175], "errorMessage": "Solo el creador puede registrar compromisos" }, { "pc": [111], "errorMessage": "can only call when creating" }, { "pc": [85, 97], "errorMessage": "can only call when not creating" }, { "pc": [179], "errorMessage": "check self.compromisos_registrados exists" }], "pcOffsetMethod": "none" }, "clear": { "sourceInfo": [], "pcOffsetMethod": "none" } }, "source": { "approval": "I3ByYWdtYSB2ZXJzaW9uIDEwCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBzbWFydF9jb250cmFjdHMudm90bzMuY29udHJhY3QuVm90bzMuX19hbGdvcHlfZW50cnlwb2ludF93aXRoX2luaXQoKSAtPiB1aW50NjQ6Cm1haW46CiAgICBpbnRjYmxvY2sgMCAxCiAgICBieXRlY2Jsb2NrICJjb21wcm9taXNvc19yZWdpc3RyYWRvcyIgImFzc2V0X2lkIgogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgIGJueiBtYWluX2FmdGVyX2lmX2Vsc2VAMgogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjcKICAgIC8vIHNlbGYuY29tcHJvbWlzb3NfcmVnaXN0cmFkb3MgPSBVSW50NjQoMCkKICAgIGJ5dGVjXzAgLy8gImNvbXByb21pc29zX3JlZ2lzdHJhZG9zIgogICAgaW50Y18wIC8vIDAKICAgIGFwcF9nbG9iYWxfcHV0CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6OAogICAgLy8gc2VsZi5hc3NldF9pZCA9IEFzc2V0KDApCiAgICBieXRlY18xIC8vICJhc3NldF9pZCIKICAgIGludGNfMCAvLyAwCiAgICBhcHBfZ2xvYmFsX3B1dAoKbWFpbl9hZnRlcl9pZl9lbHNlQDI6CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6NQogICAgLy8gY2xhc3MgVm90bzMoQVJDNENvbnRyYWN0KToKICAgIHR4biBOdW1BcHBBcmdzCiAgICBieiBtYWluX2JhcmVfcm91dGluZ0A3CiAgICBwdXNoYnl0ZXNzIDB4ZjlhOWU3ZWQgMHgwZDcwNGYwZiAvLyBtZXRob2QgImluaWNpYWxpemFyX2VsZWNjaW9uKCl2b2lkIiwgbWV0aG9kICJyZWdpc3RyYXJfY29tcHJvbWlzbygpdm9pZCIKICAgIHR4bmEgQXBwbGljYXRpb25BcmdzIDAKICAgIG1hdGNoIG1haW5faW5pY2lhbGl6YXJfZWxlY2Npb25fcm91dGVANSBtYWluX3JlZ2lzdHJhcl9jb21wcm9taXNvX3JvdXRlQDYKCm1haW5fYWZ0ZXJfaWZfZWxzZUA5OgogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjUKICAgIC8vIGNsYXNzIFZvdG8zKEFSQzRDb250cmFjdCk6CiAgICBpbnRjXzAgLy8gMAogICAgcmV0dXJuCgptYWluX3JlZ2lzdHJhcl9jb21wcm9taXNvX3JvdXRlQDY6CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MjQKICAgIC8vIEBhYmltZXRob2QoYWxsb3dfYWN0aW9ucz1bIk5vT3AiXSkKICAgIHR4biBPbkNvbXBsZXRpb24KICAgICEKICAgIGFzc2VydCAvLyBPbkNvbXBsZXRpb24gaXMgbm90IE5vT3AKICAgIHR4biBBcHBsaWNhdGlvbklECiAgICBhc3NlcnQgLy8gY2FuIG9ubHkgY2FsbCB3aGVuIG5vdCBjcmVhdGluZwogICAgY2FsbHN1YiByZWdpc3RyYXJfY29tcHJvbWlzbwogICAgaW50Y18xIC8vIDEKICAgIHJldHVybgoKbWFpbl9pbmljaWFsaXphcl9lbGVjY2lvbl9yb3V0ZUA1OgogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjEwCiAgICAvLyBAYWJpbWV0aG9kKGFsbG93X2FjdGlvbnM9WyJOb09wIl0pCiAgICB0eG4gT25Db21wbGV0aW9uCiAgICAhCiAgICBhc3NlcnQgLy8gT25Db21wbGV0aW9uIGlzIG5vdCBOb09wCiAgICB0eG4gQXBwbGljYXRpb25JRAogICAgYXNzZXJ0IC8vIGNhbiBvbmx5IGNhbGwgd2hlbiBub3QgY3JlYXRpbmcKICAgIGNhbGxzdWIgaW5pY2lhbGl6YXJfZWxlY2Npb24KICAgIGludGNfMSAvLyAxCiAgICByZXR1cm4KCm1haW5fYmFyZV9yb3V0aW5nQDc6CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6NQogICAgLy8gY2xhc3MgVm90bzMoQVJDNENvbnRyYWN0KToKICAgIHR4biBPbkNvbXBsZXRpb24KICAgIGJueiBtYWluX2FmdGVyX2lmX2Vsc2VAOQogICAgdHhuIEFwcGxpY2F0aW9uSUQKICAgICEKICAgIGFzc2VydCAvLyBjYW4gb25seSBjYWxsIHdoZW4gY3JlYXRpbmcKICAgIGludGNfMSAvLyAxCiAgICByZXR1cm4KCgovLyBzbWFydF9jb250cmFjdHMudm90bzMuY29udHJhY3QuVm90bzMuaW5pY2lhbGl6YXJfZWxlY2Npb24oKSAtPiB2b2lkOgppbmljaWFsaXphcl9lbGVjY2lvbjoKICAgIC8vIHNtYXJ0X2NvbnRyYWN0cy92b3RvMy9jb250cmFjdC5weToxMgogICAgLy8gYXNzZXJ0IFR4bi5zZW5kZXIgPT0gR2xvYmFsLmNyZWF0b3JfYWRkcmVzcywgIlNvbG8gZWwgY3JlYWRvciBwdWVkZSBpbmljaWFsaXphciBsYSBlbGVjY2nDs24iCiAgICB0eG4gU2VuZGVyCiAgICBnbG9iYWwgQ3JlYXRvckFkZHJlc3MKICAgID09CiAgICBhc3NlcnQgLy8gU29sbyBlbCBjcmVhZG9yIHB1ZWRlIGluaWNpYWxpemFyIGxhIGVsZWNjacOzbgogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjEzLTIxCiAgICAvLyBhc3NldF90eG4gPSBpdHhuLkFzc2V0Q29uZmlnKAogICAgLy8gICAgIGFzc2V0X25hbWU9YiJQQVBFTEVUQSIsCiAgICAvLyAgICAgdW5pdF9uYW1lPWIiVjNQIiwKICAgIC8vICAgICB0b3RhbD1VSW50NjQoMTAwMDAwMDAwKSwKICAgIC8vICAgICBkZWNpbWFscz0wLAogICAgLy8gICAgIGZlZT0wLAogICAgLy8gICAgIG1hbmFnZXI9R2xvYmFsLmN1cnJlbnRfYXBwbGljYXRpb25fYWRkcmVzcywKICAgIC8vICAgICBjbGF3YmFjaz1HbG9iYWwuY3VycmVudF9hcHBsaWNhdGlvbl9hZGRyZXNzLAogICAgLy8gKS5zdWJtaXQoKQogICAgaXR4bl9iZWdpbgogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjE5CiAgICAvLyBtYW5hZ2VyPUdsb2JhbC5jdXJyZW50X2FwcGxpY2F0aW9uX2FkZHJlc3MsCiAgICBnbG9iYWwgQ3VycmVudEFwcGxpY2F0aW9uQWRkcmVzcwogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjIwCiAgICAvLyBjbGF3YmFjaz1HbG9iYWwuY3VycmVudF9hcHBsaWNhdGlvbl9hZGRyZXNzLAogICAgZHVwCiAgICBpdHhuX2ZpZWxkIENvbmZpZ0Fzc2V0Q2xhd2JhY2sKICAgIGl0eG5fZmllbGQgQ29uZmlnQXNzZXRNYW5hZ2VyCiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MTcKICAgIC8vIGRlY2ltYWxzPTAsCiAgICBpbnRjXzAgLy8gMAogICAgaXR4bl9maWVsZCBDb25maWdBc3NldERlY2ltYWxzCiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MTYKICAgIC8vIHRvdGFsPVVJbnQ2NCgxMDAwMDAwMDApLAogICAgcHVzaGludCAxMDAwMDAwMDAgLy8gMTAwMDAwMDAwCiAgICBpdHhuX2ZpZWxkIENvbmZpZ0Fzc2V0VG90YWwKICAgIC8vIHNtYXJ0X2NvbnRyYWN0cy92b3RvMy9jb250cmFjdC5weToxNQogICAgLy8gdW5pdF9uYW1lPWIiVjNQIiwKICAgIHB1c2hieXRlcyAweDU2MzM1MAogICAgaXR4bl9maWVsZCBDb25maWdBc3NldFVuaXROYW1lCiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MTQKICAgIC8vIGFzc2V0X25hbWU9YiJQQVBFTEVUQSIsCiAgICBwdXNoYnl0ZXMgMHg1MDQxNTA0NTRjNDU1NDQxCiAgICBpdHhuX2ZpZWxkIENvbmZpZ0Fzc2V0TmFtZQogICAgLy8gc21hcnRfY29udHJhY3RzL3ZvdG8zL2NvbnRyYWN0LnB5OjEzCiAgICAvLyBhc3NldF90eG4gPSBpdHhuLkFzc2V0Q29uZmlnKAogICAgcHVzaGludCAzIC8vIGFjZmcKICAgIGl0eG5fZmllbGQgVHlwZUVudW0KICAgIC8vIHNtYXJ0X2NvbnRyYWN0cy92b3RvMy9jb250cmFjdC5weToxOAogICAgLy8gZmVlPTAsCiAgICBpbnRjXzAgLy8gMAogICAgaXR4bl9maWVsZCBGZWUKICAgIC8vIHNtYXJ0X2NvbnRyYWN0cy92b3RvMy9jb250cmFjdC5weToxMy0yMQogICAgLy8gYXNzZXRfdHhuID0gaXR4bi5Bc3NldENvbmZpZygKICAgIC8vICAgICBhc3NldF9uYW1lPWIiUEFQRUxFVEEiLAogICAgLy8gICAgIHVuaXRfbmFtZT1iIlYzUCIsCiAgICAvLyAgICAgdG90YWw9VUludDY0KDEwMDAwMDAwMCksCiAgICAvLyAgICAgZGVjaW1hbHM9MCwKICAgIC8vICAgICBmZWU9MCwKICAgIC8vICAgICBtYW5hZ2VyPUdsb2JhbC5jdXJyZW50X2FwcGxpY2F0aW9uX2FkZHJlc3MsCiAgICAvLyAgICAgY2xhd2JhY2s9R2xvYmFsLmN1cnJlbnRfYXBwbGljYXRpb25fYWRkcmVzcywKICAgIC8vICkuc3VibWl0KCkKICAgIGl0eG5fc3VibWl0CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MjIKICAgIC8vIHNlbGYuYXNzZXRfaWQgPSBhc3NldF90eG4uY3JlYXRlZF9hc3NldAogICAgYnl0ZWNfMSAvLyAiYXNzZXRfaWQiCiAgICBpdHhuIENyZWF0ZWRBc3NldElECiAgICBhcHBfZ2xvYmFsX3B1dAogICAgcmV0c3ViCgoKLy8gc21hcnRfY29udHJhY3RzLnZvdG8zLmNvbnRyYWN0LlZvdG8zLnJlZ2lzdHJhcl9jb21wcm9taXNvKCkgLT4gdm9pZDoKcmVnaXN0cmFyX2NvbXByb21pc286CiAgICAvLyBzbWFydF9jb250cmFjdHMvdm90bzMvY29udHJhY3QucHk6MjYKICAgIC8vIGFzc2VydCBUeG4uc2VuZGVyID09IEdsb2JhbC5jcmVhdG9yX2FkZHJlc3MsICJTb2xvIGVsIGNyZWFkb3IgcHVlZGUgcmVnaXN0cmFyIGNvbXByb21pc29zIgogICAgdHhuIFNlbmRlcgogICAgZ2xvYmFsIENyZWF0b3JBZGRyZXNzCiAgICA9PQogICAgYXNzZXJ0IC8vIFNvbG8gZWwgY3JlYWRvciBwdWVkZSByZWdpc3RyYXIgY29tcHJvbWlzb3MKICAgIC8vIHNtYXJ0X2NvbnRyYWN0cy92b3RvMy9jb250cmFjdC5weToyNwogICAgLy8gc2VsZi5jb21wcm9taXNvc19yZWdpc3RyYWRvcyArPSBVSW50NjQoMSkKICAgIGludGNfMCAvLyAwCiAgICBieXRlY18wIC8vICJjb21wcm9taXNvc19yZWdpc3RyYWRvcyIKICAgIGFwcF9nbG9iYWxfZ2V0X2V4CiAgICBhc3NlcnQgLy8gY2hlY2sgc2VsZi5jb21wcm9taXNvc19yZWdpc3RyYWRvcyBleGlzdHMKICAgIGludGNfMSAvLyAxCiAgICArCiAgICBieXRlY18wIC8vICJjb21wcm9taXNvc19yZWdpc3RyYWRvcyIKICAgIHN3YXAKICAgIGFwcF9nbG9iYWxfcHV0CiAgICByZXRzdWIK", "clear": "I3ByYWdtYSB2ZXJzaW9uIDEwCiNwcmFnbWEgdHlwZXRyYWNrIGZhbHNlCgovLyBhbGdvcHkuYXJjNC5BUkM0Q29udHJhY3QuY2xlYXJfc3RhdGVfcHJvZ3JhbSgpIC0+IHVpbnQ2NDoKbWFpbjoKICAgIHB1c2hpbnQgMSAvLyAxCiAgICByZXR1cm4K" }, "byteCode": { "approval": "CiACAAEmAhdjb21wcm9taXNvc19yZWdpc3RyYWRvcwhhc3NldF9pZDEYQAAGKCJnKSJnMRtBAC+CAgT5qeftBA1wTw82GgCOAgAOAAIiQzEZFEQxGESIAFEjQzEZFEQxGESIAA0jQzEZQP/hMRgURCNDMQAyCRJEsTIKSbIssikisiOBgMLXL7IigANWM1CyJYAIUEFQRUxFVEGyJoEDshAisgGzKbQ8Z4kxADIJEkQiKGVEIwgoTGeJ", "clear": "CoEBQw==" }, "compilerInfo": { "compiler": "puya", "compilerVersion": { "major": 4, "minor": 9, "patch": 0 } }, "events": [], "templateVariables": {} };
class BinaryStateValue {
    constructor(value) {
        this.value = value;
    }
    asByteArray() {
        return this.value;
    }
    asString() {
        return this.value !== undefined ? Buffer.from(this.value).toString('utf-8') : undefined;
    }
}
/**
 * Exposes methods for constructing `AppClient` params objects for ABI calls to the Voto3 smart contract
 */
export class Voto3ParamsFactory {
    /**
     * Constructs a no op call for the inicializar_eleccion()void ABI method
     *
     * @param params Parameters for the call
     * @returns An `AppClientMethodCallParams` object for the call
     */
    static inicializarEleccion(params) {
        return {
            ...params,
            method: 'inicializar_eleccion()void',
            args: Array.isArray(params.args) ? params.args : [],
        };
    }
    /**
     * Constructs a no op call for the registrar_compromiso()void ABI method
     *
     * @param params Parameters for the call
     * @returns An `AppClientMethodCallParams` object for the call
     */
    static registrarCompromiso(params) {
        return {
            ...params,
            method: 'registrar_compromiso()void',
            args: Array.isArray(params.args) ? params.args : [],
        };
    }
}
/**
 * A factory to create and deploy one or more instance of the Voto3 smart contract and to create one or more app clients to interact with those (or other) app instances
 */
export class Voto3Factory {
    /**
     * Creates a new instance of `Voto3Factory`
     *
     * @param params The parameters to initialise the app factory with
     */
    constructor(params) {
        /**
         * Get parameters to create transactions (create and deploy related calls) for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.
         */
        this.params = {
            /**
             * Gets available create methods
             */
            create: {
                /**
                 * Creates a new instance of the Voto3 smart contract using a bare call.
                 *
                 * @param params The params for the bare (raw) call
                 * @returns The params for a create call
                 */
                bare: (params) => {
                    return this.appFactory.params.bare.create(params);
                },
            },
        };
        /**
         * Create transactions for the current app
         */
        this.createTransaction = {
            /**
             * Gets available create methods
             */
            create: {
                /**
                 * Creates a new instance of the Voto3 smart contract using a bare call.
                 *
                 * @param params The params for the bare (raw) call
                 * @returns The transaction for a create call
                 */
                bare: (params) => {
                    return this.appFactory.createTransaction.bare.create(params);
                },
            },
        };
        /**
         * Send calls to the current app
         */
        this.send = {
            /**
             * Gets available create methods
             */
            create: {
                /**
                 * Creates a new instance of the Voto3 smart contract using a bare call.
                 *
                 * @param params The params for the bare (raw) call
                 * @returns The create result
                 */
                bare: async (params) => {
                    const result = await this.appFactory.send.bare.create(params);
                    return { result: result.result, appClient: new Voto3Client(result.appClient) };
                },
            },
        };
        this.appFactory = new _AppFactory({
            ...params,
            appSpec: APP_SPEC,
        });
    }
    /** The name of the app (from the ARC-32 / ARC-56 app spec or override). */
    get appName() {
        return this.appFactory.appName;
    }
    /** The ARC-56 app spec being used */
    get appSpec() {
        return APP_SPEC;
    }
    /** A reference to the underlying `AlgorandClient` this app factory is using. */
    get algorand() {
        return this.appFactory.algorand;
    }
    /**
     * Returns a new `AppClient` client for an app instance of the given ID.
     *
     * Automatically populates appName, defaultSender and source maps from the factory
     * if not specified in the params.
     * @param params The parameters to create the app client
     * @returns The `AppClient`
     */
    getAppClientById(params) {
        return new Voto3Client(this.appFactory.getAppClientById(params));
    }
    /**
     * Returns a new `AppClient` client, resolving the app by creator address and name
     * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
     *
     * Automatically populates appName, defaultSender and source maps from the factory
     * if not specified in the params.
     * @param params The parameters to create the app client
     * @returns The `AppClient`
     */
    async getAppClientByCreatorAndName(params) {
        return new Voto3Client(await this.appFactory.getAppClientByCreatorAndName(params));
    }
    /**
     * Idempotently deploys the Voto3 smart contract.
     *
     * @param params The arguments for the contract calls and any additional parameters for the call
     * @returns The deployment result
     */
    async deploy(params = {}) {
        const result = await this.appFactory.deploy({
            ...params,
        });
        return { result: result.result, appClient: new Voto3Client(result.appClient) };
    }
}
/**
 * A client to make calls to the Voto3 smart contract
 */
export class Voto3Client {
    constructor(appClientOrParams) {
        /**
         * Get parameters to create transactions for the current app. A good mental model for this is that these parameters represent a deferred transaction creation.
         */
        this.params = {
            /**
             * Makes a clear_state call to an existing instance of the Voto3 smart contract.
             *
             * @param params The params for the bare (raw) call
             * @returns The clearState result
             */
            clearState: (params) => {
                return this.appClient.params.bare.clearState(params);
            },
            /**
             * Makes a call to the Voto3 smart contract using the `inicializar_eleccion()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call params
             */
            inicializarEleccion: (params = { args: [] }) => {
                return this.appClient.params.call(Voto3ParamsFactory.inicializarEleccion(params));
            },
            /**
             * Makes a call to the Voto3 smart contract using the `registrar_compromiso()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call params
             */
            registrarCompromiso: (params = { args: [] }) => {
                return this.appClient.params.call(Voto3ParamsFactory.registrarCompromiso(params));
            },
        };
        /**
         * Create transactions for the current app
         */
        this.createTransaction = {
            /**
             * Makes a clear_state call to an existing instance of the Voto3 smart contract.
             *
             * @param params The params for the bare (raw) call
             * @returns The clearState result
             */
            clearState: (params) => {
                return this.appClient.createTransaction.bare.clearState(params);
            },
            /**
             * Makes a call to the Voto3 smart contract using the `inicializar_eleccion()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call transaction
             */
            inicializarEleccion: (params = { args: [] }) => {
                return this.appClient.createTransaction.call(Voto3ParamsFactory.inicializarEleccion(params));
            },
            /**
             * Makes a call to the Voto3 smart contract using the `registrar_compromiso()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call transaction
             */
            registrarCompromiso: (params = { args: [] }) => {
                return this.appClient.createTransaction.call(Voto3ParamsFactory.registrarCompromiso(params));
            },
        };
        /**
         * Send calls to the current app
         */
        this.send = {
            /**
             * Makes a clear_state call to an existing instance of the Voto3 smart contract.
             *
             * @param params The params for the bare (raw) call
             * @returns The clearState result
             */
            clearState: (params) => {
                return this.appClient.send.bare.clearState(params);
            },
            /**
             * Makes a call to the Voto3 smart contract using the `inicializar_eleccion()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call result
             */
            inicializarEleccion: async (params = { args: [] }) => {
                const result = await this.appClient.send.call(Voto3ParamsFactory.inicializarEleccion(params));
                return { ...result, return: result.return };
            },
            /**
             * Makes a call to the Voto3 smart contract using the `registrar_compromiso()void` ABI method.
             *
             * @param params The params for the smart contract call
             * @returns The call result
             */
            registrarCompromiso: async (params = { args: [] }) => {
                const result = await this.appClient.send.call(Voto3ParamsFactory.registrarCompromiso(params));
                return { ...result, return: result.return };
            },
        };
        /**
         * Methods to access state for the current Voto3 app
         */
        this.state = {
            /**
             * Methods to access global state for the current Voto3 app
             */
            global: {
                /**
                 * Get all current keyed values from global state
                 */
                getAll: async () => {
                    const result = await this.appClient.state.global.getAll();
                    return {
                        compromisosRegistrados: result.compromisos_registrados,
                        assetId: result.asset_id,
                    };
                },
                /**
                 * Get the current value of the compromisos_registrados key in global state
                 */
                compromisosRegistrados: async () => { return (await this.appClient.state.global.getValue("compromisos_registrados")); },
                /**
                 * Get the current value of the asset_id key in global state
                 */
                assetId: async () => { return (await this.appClient.state.global.getValue("asset_id")); },
            },
        };
        this.appClient = appClientOrParams instanceof _AppClient ? appClientOrParams : new _AppClient({
            ...appClientOrParams,
            appSpec: APP_SPEC,
        });
    }
    /**
     * Checks for decode errors on the given return value and maps the return value to the return type for the given method
     * @returns The typed return value or undefined if there was no value
     */
    decodeReturnValue(method, returnValue) {
        return returnValue !== undefined ? getArc56ReturnValue(returnValue, this.appClient.getABIMethod(method), APP_SPEC.structs) : undefined;
    }
    /**
     * Returns a new `Voto3Client` client, resolving the app by creator address and name
     * using AlgoKit app deployment semantics (i.e. looking for the app creation transaction note).
     * @param params The parameters to create the app client
     */
    static async fromCreatorAndName(params) {
        return new Voto3Client(await _AppClient.fromCreatorAndName({ ...params, appSpec: APP_SPEC }));
    }
    /**
     * Returns an `Voto3Client` instance for the current network based on
     * pre-determined network-specific app IDs specified in the ARC-56 app spec.
     *
     * If no IDs are in the app spec or the network isn't recognised, an error is thrown.
     * @param params The parameters to create the app client
     */
    static async fromNetwork(params) {
        return new Voto3Client(await _AppClient.fromNetwork({ ...params, appSpec: APP_SPEC }));
    }
    /** The ID of the app instance this client is linked to. */
    get appId() {
        return this.appClient.appId;
    }
    /** The app address of the app instance this client is linked to. */
    get appAddress() {
        return this.appClient.appAddress;
    }
    /** The name of the app. */
    get appName() {
        return this.appClient.appName;
    }
    /** The ARC-56 app spec being used */
    get appSpec() {
        return this.appClient.appSpec;
    }
    /** A reference to the underlying `AlgorandClient` this app client is using. */
    get algorand() {
        return this.appClient.algorand;
    }
    /**
     * Clone this app client with different params
     *
     * @param params The params to use for the the cloned app client. Omit a param to keep the original value. Set a param to override the original value. Setting to undefined will clear the original value.
     * @returns A new app client with the altered params
     */
    clone(params) {
        return new Voto3Client(this.appClient.clone(params));
    }
    newGroup() {
        const client = this;
        const composer = this.algorand.newGroup();
        let promiseChain = Promise.resolve();
        const resultMappers = [];
        return {
            /**
             * Add a inicializar_eleccion()void method call against the Voto3 contract
             */
            inicializarEleccion(params) {
                promiseChain = promiseChain.then(async () => composer.addAppCallMethodCall(await client.params.inicializarEleccion(params)));
                resultMappers.push(undefined);
                return this;
            },
            /**
             * Add a registrar_compromiso()void method call against the Voto3 contract
             */
            registrarCompromiso(params) {
                promiseChain = promiseChain.then(async () => composer.addAppCallMethodCall(await client.params.registrarCompromiso(params)));
                resultMappers.push(undefined);
                return this;
            },
            /**
             * Add a clear state call to the Voto3 contract
             */
            clearState(params) {
                promiseChain = promiseChain.then(() => composer.addAppCall(client.params.clearState(params)));
                return this;
            },
            addTransaction(txn, signer) {
                promiseChain = promiseChain.then(() => composer.addTransaction(txn, signer));
                return this;
            },
            async composer() {
                await promiseChain;
                return composer;
            },
            async simulate(options) {
                await promiseChain;
                const result = await (!options ? composer.simulate() : composer.simulate(options));
                return {
                    ...result,
                    returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i](val) : val.returnValue)
                };
            },
            async send(params) {
                await promiseChain;
                const result = await composer.send(params);
                return {
                    ...result,
                    returns: result.returns?.map((val, i) => resultMappers[i] !== undefined ? resultMappers[i](val) : val.returnValue)
                };
            }
        };
    }
}
