import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Button,
  Typography,
  IconButton,
  Paper
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface FractionCalculatorProps {
  open: boolean;
  onClose: () => void;
}

const FractionCalculator: React.FC<FractionCalculatorProps> = ({ open, onClose }) => {
  const [display, setDisplay] = useState('0');
  const [currentInput, setCurrentInput] = useState('');
  const [operator, setOperator] = useState<string | null>(null);
  const [firstValue, setFirstValue] = useState<string | null>(null);

  // Convert fraction string to decimal
  const fractionToDecimal = (str: string): number => {
    // Handle mixed numbers like "1 1/4"
    const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseInt(mixedMatch[1]);
      const num = parseInt(mixedMatch[2]);
      const den = parseInt(mixedMatch[3]);
      return whole + (num / den);
    }

    // Handle simple fractions like "1/4"
    const fractionMatch = str.match(/^(\d+)\/(\d+)$/);
    if (fractionMatch) {
      const num = parseInt(fractionMatch[1]);
      const den = parseInt(fractionMatch[2]);
      return num / den;
    }

    // Handle regular decimal/whole numbers
    return parseFloat(str) || 0;
  };

  // Convert decimal to fraction string
  const decimalToFraction = (decimal: number): string => {
    const tolerance = 1.0E-6;
    let h1 = 1, h2 = 0, k1 = 0, k2 = 1;
    let b = decimal;
    
    const whole = Math.floor(decimal);
    let fraction = decimal - whole;

    do {
      const a = Math.floor(b);
      let aux = h1;
      h1 = a * h1 + h2;
      h2 = aux;
      aux = k1;
      k1 = a * k1 + k2;
      k2 = aux;
      b = 1 / (b - a);
    } while (Math.abs(fraction - h1 / k1) > fraction * tolerance);

    if (whole === 0) {
      return `${h1}/${k1}`;
    } else if (h1 === 0) {
      return `${whole}`;
    } else {
      return `${whole} ${h1}/${k1}`;
    }
  };

  const handleNumberClick = (num: string) => {
    if (display === '0' && num !== '.') {
      setDisplay(num);
      setCurrentInput(num);
    } else {
      setDisplay(display + num);
      setCurrentInput(currentInput + num);
    }
  };

  const handleFractionClick = (fraction: string) => {
    setDisplay(display + fraction);
    setCurrentInput(currentInput + fraction);
  };

  const handleOperatorClick = (op: string) => {
    if (currentInput) {
      setFirstValue(currentInput);
      setOperator(op);
      setDisplay(display + ` ${op} `);
      setCurrentInput('');
    }
  };

  const handleEquals = () => {
    if (firstValue && operator && currentInput) {
      const val1 = fractionToDecimal(firstValue);
      const val2 = fractionToDecimal(currentInput);
      let result = 0;

      switch (operator) {
        case '+':
          result = val1 + val2;
          break;
        case '-':
          result = val1 - val2;
          break;
        case '×':
          result = val1 * val2;
          break;
        case '÷':
          result = val1 / val2;
          break;
      }

      const fractionResult = decimalToFraction(result);
      const decimalResult = result.toFixed(4);
      setDisplay(`${fractionResult} (${decimalResult}")`);
      setCurrentInput('');
      setFirstValue(null);
      setOperator(null);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setCurrentInput('');
    setOperator(null);
    setFirstValue(null);
  };

  const handleSpace = () => {
    setDisplay(display + ' ');
    setCurrentInput(currentInput + ' ');
  };

  const handleSlash = () => {
    setDisplay(display + '/');
    setCurrentInput(currentInput + '/');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Fraction Calculator</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ p: 2 }}>
          {/* Display */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              mb: 3,
              bgcolor: '#e3f2fd',
              minHeight: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              border: '2px solid #1976d2'
            }}
          >
            <Typography variant="h5" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {display}
            </Typography>
          </Paper>

          {/* Common Fractions */}
          <Typography variant="subtitle2" gutterBottom sx={{ color: 'text.secondary' }}>
            Common Fractions:
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1, mb: 2 }}>
            {['1/2', '1/4', '3/4', '1/8', '3/8', '5/8', '7/8', '1/16', '3/16', '5/16', '11/16', '13/16'].map((frac) => (
              <Button
                key={frac}
                variant="outlined"
                onClick={() => handleFractionClick(frac)}
                sx={{ minWidth: 0, fontSize: '0.875rem' }}
              >
                {frac}
              </Button>
            ))}
          </Box>

          {/* Number Pad */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1 }}>
            {/* Row 1 */}
            <Button variant="contained" color="error" onClick={handleClear} sx={{ fontSize: '1.25rem' }}>
              C
            </Button>
            <Button variant="outlined" onClick={handleSpace}>
              Space
            </Button>
            <Button variant="outlined" onClick={handleSlash}>
              /
            </Button>
            <Button variant="contained" color="warning" onClick={() => handleOperatorClick('÷')}>
              ÷
            </Button>

            {/* Row 2 */}
            <Button variant="outlined" onClick={() => handleNumberClick('7')}>7</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('8')}>8</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('9')}>9</Button>
            <Button variant="contained" color="warning" onClick={() => handleOperatorClick('×')}>
              ×
            </Button>

            {/* Row 3 */}
            <Button variant="outlined" onClick={() => handleNumberClick('4')}>4</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('5')}>5</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('6')}>6</Button>
            <Button variant="contained" color="warning" onClick={() => handleOperatorClick('-')}>
              -
            </Button>

            {/* Row 4 */}
            <Button variant="outlined" onClick={() => handleNumberClick('1')}>1</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('2')}>2</Button>
            <Button variant="outlined" onClick={() => handleNumberClick('3')}>3</Button>
            <Button variant="contained" color="warning" onClick={() => handleOperatorClick('+')}>
              +
            </Button>

            {/* Row 5 */}
            <Button variant="outlined" onClick={() => handleNumberClick('0')} sx={{ gridColumn: 'span 2' }}>
              0
            </Button>
            <Button variant="outlined" onClick={() => handleNumberClick('.')}>
              .
            </Button>
            <Button variant="contained" color="success" onClick={handleEquals}>
              =
            </Button>
          </Box>

          <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'text.secondary', textAlign: 'center' }}>
            💡 Tip: For mixed numbers, use space (e.g., "1 1/4" for 1¼)
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default FractionCalculator;
