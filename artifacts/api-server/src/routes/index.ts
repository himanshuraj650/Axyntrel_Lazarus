import { Router, type IRouter } from "express";
import healthRouter from "./health";
import lazarusRouter from "./lazarus";

const router: IRouter = Router();

router.use(healthRouter);
router.use(lazarusRouter);

export default router;
