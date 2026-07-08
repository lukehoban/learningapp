import { app } from '@azure/functions';
import './functions/generateProblem';
import './functions/checkAnswer';

// Suppress unused-var warnings – these imports register Functions as a side effect
void app;
