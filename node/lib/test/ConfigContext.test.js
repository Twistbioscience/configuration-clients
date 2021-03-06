"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const EnvConfigContext_1 = __importStar(require("../src/EnvConfigContext"));
const MOCK_CONF_NO_CONTEXT = { mitzi: ' miao ' };
// const MOCK_CONF_WITH_CONTEXT_REF = { "mitzi": " {{ miao }} " }
const MOCK_CONF_NO_CONTEXT_REF = {
    [EnvConfigContext_1.CONTEXT_DECLARATION_KEY]: { x: 1 },
    ...MOCK_CONF_NO_CONTEXT,
};
const MOCK_CONF = {
    [EnvConfigContext_1.CONTEXT_DECLARATION_KEY]: {
        staging: { test_str: '__val__', test_int: 1974 },
        russian: { thanks: 'spasibo!' },
        hebrew: { thanks: 'toda!' },
    },
    data: {
        str: '{{ test_str }}',
        mixed_str: 'ABCD{{    test_str}}ABCD',
        int: '{{test_int}}',
        thanks: '{{thanks}}',
    },
};
const MOCK_COMPOSITE_CONF = {
    [EnvConfigContext_1.CONTEXT_DECLARATION_KEY]: {
        staging: { test_str: 'oren', test_int: 1974 },
        russian: { thanks: 'spasibo!' },
        hebrew: { thanks: 'toda!' },
    },
    data: {
        str: '{{ test_str }}',
        mixed_str: 'ABCD{{    test_str}}ABCD',
        int: '{{test_int}}',
        thanks: '{{ test_str }}, {{thanks}}',
    },
};
function deepCopy(json) {
    return JSON.parse(JSON.stringify(json));
}
describe('Test ConfigContext Traits', () => {
    test('test no context in conf yields original data', () => {
        const testee = new EnvConfigContext_1.default('dummy_env_name');
        testee.add('mitzi', 'woofwoof');
        const actual = testee.process(MOCK_CONF_NO_CONTEXT);
        const expected = deepCopy(MOCK_CONF_NO_CONTEXT);
        expect(actual).toEqual(expected);
    });
    test('test context without ref in conf yields original data', () => {
        const testee = new EnvConfigContext_1.default('dummy_env_name');
        testee.add('mitzi', 'woofwoof');
        const actual = testee.process(MOCK_CONF_NO_CONTEXT_REF);
        const expected = deepCopy(MOCK_CONF_NO_CONTEXT_REF);
        delete expected[EnvConfigContext_1.CONTEXT_DECLARATION_KEY];
        expect(actual).toEqual(expected);
    });
    test('test context and data yield modified version', () => {
        const testee = new EnvConfigContext_1.default('staging');
        testee.add('language', 'russian');
        const actual = testee.process(MOCK_CONF);
        const expected = deepCopy(MOCK_CONF);
        delete expected[EnvConfigContext_1.CONTEXT_DECLARATION_KEY];
        expected.data = {
            str: '__val__',
            mixed_str: 'ABCD__val__ABCD',
            int: 1974,
            thanks: 'spasibo!',
        };
        expect(actual).toEqual(expected);
        const testee2 = new EnvConfigContext_1.default('staging');
        testee2.add('language', 'hebrew');
        const actual2 = testee2.process(MOCK_CONF);
        const expected2 = deepCopy(MOCK_CONF);
        delete expected2[EnvConfigContext_1.CONTEXT_DECLARATION_KEY];
        expected2.data = {
            str: '__val__',
            mixed_str: 'ABCD__val__ABCD',
            int: 1974,
            thanks: 'toda!',
        };
        expect(actual2).toEqual(expected2);
    });
    test('test context and composite data yield modified version', () => {
        const testee = new EnvConfigContext_1.default('staging');
        testee.add('language', 'russian');
        const actual = testee.process(MOCK_COMPOSITE_CONF);
        const expected = deepCopy(MOCK_COMPOSITE_CONF);
        delete expected[EnvConfigContext_1.CONTEXT_DECLARATION_KEY];
        expected.data = {
            str: 'oren',
            mixed_str: 'ABCDorenABCD',
            int: 1974,
            thanks: 'oren, spasibo!',
        };
        expect(actual).toEqual(expected);
    });
    test('test validation that when finds template it raise exception', () => {
        let actual;
        let testee;
        try {
            testee = { dummy: 'asdfadsfasd {{ aaa     }}sdsdfsd' };
            actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        }
        catch (e) {
            actual = undefined;
        }
        expect(actual).toBeUndefined();
        try {
            testee = { dummy: '{{aaa}}' };
            actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        }
        catch (e) {
            actual = undefined;
        }
        expect(actual).toBeUndefined();
        try {
            testee = { dummy: '{{a_a-A.y}}' };
            actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        }
        catch (e) {
            actual = undefined;
        }
        expect(actual).toBeUndefined();
    });
    test('test validation that when no template found it returns false', () => {
        let actual;
        let testee;
        testee = { dummy: 'asdfadsfasd { aaa     }}sdsdfsd' };
        actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        expect(actual).toBeFalsy();
        testee = { dummy: '{aaa}' };
        actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        expect(actual).toBeFalsy();
        testee = { dummy: '{ { {a_a-A}}}' };
        actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        expect(actual).toBeFalsy();
        testee = { dummy: '{ {a_a-A} }' };
        actual = EnvConfigContext_1.validateNoTemplateLeft(testee);
        expect(actual).toBeFalsy();
    });
});
//# sourceMappingURL=ConfigContext.test.js.map