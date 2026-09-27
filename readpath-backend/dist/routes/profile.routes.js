"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const profile_controller_1 = require("../controllers/profile.controller");
const router = express_1.default.Router();
router.use(auth_1.authenticate);
router.get('/current', (0, auth_1.authorize)('STUDENT'), profile_controller_1.getReadingProfile);
router.get('/history', (0, auth_1.authorize)('STUDENT'), profile_controller_1.getProfileHistory);
exports.default = router;
//# sourceMappingURL=profile.routes.js.map