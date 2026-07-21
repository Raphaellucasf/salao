// Simulation tests for Comanda discount calculations in ComandaViewDrawer.tsx

function calculateSubtotal(comanda) {
  return comanda?.comanda_itens && comanda.comanda_itens.length > 0
    ? comanda.comanda_itens.reduce((sum, item) => sum + Number(item.valor_total || 0), 0)
    : Number(comanda?.subtotal || comanda?.total || 0);
}

function calculateTotalDisplay(comanda, subtotal, discountState) {
  return comanda.status === 'aberta'
    ? Math.max(0, subtotal - discountState)
    : (Number(comanda.total) || 0);
}

function parseDiscountInput(inputValue) {
  // Simulates: setDesconto(Math.max(0, parseFloat(e.target.value) || 0))
  return Math.max(0, parseFloat(inputValue) || 0);
}

function calculateFecharComanda(comanda, discountState) {
  const descontoNum = Math.max(0, Number(discountState) || 0);
  const subtotalFinal = (comanda.comanda_itens || []).reduce(
    (sum, item) => sum + Number(item.valor_total || 0), 0
  );
  const totalFinal = Math.max(0, subtotalFinal - descontoNum);
  return {
    subtotal: subtotalFinal,
    desconto: descontoNum,
    total: totalFinal
  };
}

// Test Suite
const tests = [
  {
    name: 'Normal case: subtotal = 100, discount = 15',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 60 }, { valor_total: 40 }] },
    discountState: 15,
    expectedSubtotal: 100,
    expectedTotalDisplay: 85,
    expectedFechar: { subtotal: 100, desconto: 15, total: 85 }
  },
  {
    name: 'Discount = 0',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 50 }] },
    discountState: 0,
    expectedSubtotal: 50,
    expectedTotalDisplay: 50,
    expectedFechar: { subtotal: 50, desconto: 0, total: 50 }
  },
  {
    name: 'Discount > subtotal (subtotal = 50, discount = 60)',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 50 }] },
    discountState: 60,
    expectedSubtotal: 50,
    expectedTotalDisplay: 0, // Clamped to 0
    expectedFechar: { subtotal: 50, desconto: 60, total: 0 } // Clamped to 0
  },
  {
    name: 'Subtotal = 0, discount = 10',
    comanda: { status: 'aberta', comanda_itens: [] },
    discountState: 10,
    expectedSubtotal: 0,
    expectedTotalDisplay: 0, // Clamped to 0
    expectedFechar: { subtotal: 0, desconto: 10, total: 0 } // Clamped to 0
  },
  {
    name: 'Subtotal = 0, discount = 0',
    comanda: { status: 'aberta', comanda_itens: [] },
    discountState: 0,
    expectedSubtotal: 0,
    expectedTotalDisplay: 0,
    expectedFechar: { subtotal: 0, desconto: 0, total: 0 }
  },
  {
    name: 'Parse input: negative discount "-15"',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 100 }] },
    inputValue: '-15',
    expectedParsedDiscount: 0, // Clamped to 0
    expectedSubtotal: 100,
    expectedTotalDisplay: 100,
    expectedFechar: { subtotal: 100, desconto: 0, total: 100 }
  },
  {
    name: 'Parse input: empty string ""',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 100 }] },
    inputValue: '',
    expectedParsedDiscount: 0, // Defaults to 0
    expectedSubtotal: 100,
    expectedTotalDisplay: 100,
    expectedFechar: { subtotal: 100, desconto: 0, total: 100 }
  },
  {
    name: 'Parse input: invalid string "abc"',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 100 }] },
    inputValue: 'abc',
    expectedParsedDiscount: 0, // Defaults to 0
    expectedSubtotal: 100,
    expectedTotalDisplay: 100,
    expectedFechar: { subtotal: 100, desconto: 0, total: 100 }
  },
  {
    name: 'Parse input: decimal value "12.34"',
    comanda: { status: 'aberta', comanda_itens: [{ valor_total: 100 }] },
    inputValue: '12.34',
    expectedParsedDiscount: 12.34,
    expectedSubtotal: 100,
    expectedTotalDisplay: 87.66,
    expectedFechar: { subtotal: 100, desconto: 12.34, total: 87.66 }
  }
];

let failed = false;

tests.forEach((t) => {
  console.log(`Running: ${t.name}...`);
  
  let discount = t.discountState;
  if (t.inputValue !== undefined) {
    const parsed = parseDiscountInput(t.inputValue);
    console.log(`  Parsed "${t.inputValue}" to: ${parsed}`);
    if (t.expectedParsedDiscount !== undefined && parsed !== t.expectedParsedDiscount) {
      console.error(`  FAIL: expected parsed discount ${t.expectedParsedDiscount}, got ${parsed}`);
      failed = true;
    }
    discount = parsed;
  }

  const subtotal = calculateSubtotal(t.comanda);
  if (subtotal !== t.expectedSubtotal) {
    console.error(`  FAIL: expected subtotal ${t.expectedSubtotal}, got ${subtotal}`);
    failed = true;
  }

  const totalDisplay = calculateTotalDisplay(t.comanda, subtotal, discount);
  if (Math.abs(totalDisplay - t.expectedTotalDisplay) > 0.0001) {
    console.error(`  FAIL: expected total display ${t.expectedTotalDisplay}, got ${totalDisplay}`);
    failed = true;
  }

  const fecharResult = calculateFecharComanda(t.comanda, discount);
  if (fecharResult.subtotal !== t.expectedFechar.subtotal) {
    console.error(`  FAIL: expected fechar subtotal ${t.expectedFechar.subtotal}, got ${fecharResult.subtotal}`);
    failed = true;
  }
  if (Math.abs(fecharResult.desconto - t.expectedFechar.desconto) > 0.0001) {
    console.error(`  FAIL: expected fechar desconto ${t.expectedFechar.desconto}, got ${fecharResult.desconto}`);
    failed = true;
  }
  if (Math.abs(fecharResult.total - t.expectedFechar.total) > 0.0001) {
    console.error(`  FAIL: expected fechar total ${t.expectedFechar.total}, got ${fecharResult.total}`);
    failed = true;
  }
});

if (failed) {
  console.log('Some tests FAILED.');
  process.exit(1);
} else {
  console.log('All simulation tests PASSED.');
  process.exit(0);
}
