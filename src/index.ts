import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'flowfitness-backend',
  });
});

// Only start server if this file is run directly (not imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`FlowFitness Backend server running on port ${PORT}`);
  });
}

export default app;
