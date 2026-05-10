import {
  DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
  DEFAULT_SYSTEM_DYNAMICS_STOCKS,
  simulateSystemDynamics,
} from '@/engine/simulation/SystemDynamics';

describe('SystemDynamics', () => {
  it('simulates annual stock trajectories with finite stable results', () => {
    const result = simulateSystemDynamics({
      scenarioName: 'Baseline system dynamics',
      years: 25,
    });

    expect(result.traces).toHaveLength(26);
    expect(result.timeStepYears).toBe(1);
    expect(result.stability.isStable).toBe(true);
    expect(result.stockFlowDiagram.nodes.length).toBeGreaterThan(0);
    expect(result.causalLoopGraph.loops).toHaveLength(3);

    for (const trace of result.traces) {
      expect(trace.stocks.population).toBeGreaterThan(0);
      expect(trace.stocks.housing).toBeGreaterThan(0);
      expect(trace.stocks.employment).toBeGreaterThan(0);
      expect(trace.stocks.transportCapacity).toBeGreaterThan(0);
      expect(trace.stocks.greenSpace).toBeGreaterThan(0);
    }
  });

  it('responds to green protection in the expected direction', () => {
    const weakProtection = simulateSystemDynamics({
      years: 20,
      policyLevers: {
        ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
        greenProtection: 10,
        compactGrowth: 20,
      },
    });
    const strongProtection = simulateSystemDynamics({
      years: 20,
      policyLevers: {
        ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
        greenProtection: 90,
        compactGrowth: 85,
      },
    });

    expect(strongProtection.finalStocks.greenSpace).toBeGreaterThan(weakProtection.finalStocks.greenSpace);
    expect(strongProtection.traces.at(-1)?.indicators.greenSpacePerCapita ?? 0).toBeGreaterThan(
      weakProtection.traces.at(-1)?.indicators.greenSpacePerCapita ?? 0,
    );
  });

  it('responds to housing incentives in the expected direction', () => {
    const lowHousing = simulateSystemDynamics({
      years: 18,
      policyLevers: {
        ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
        housingIncentive: 20,
      },
    });
    const highHousing = simulateSystemDynamics({
      years: 18,
      policyLevers: {
        ...DEFAULT_SYSTEM_DYNAMICS_POLICY_LEVERS,
        housingIncentive: 90,
      },
    });

    expect(highHousing.finalStocks.housing).toBeGreaterThan(lowHousing.finalStocks.housing);
    expect(highHousing.traces.at(-1)?.indicators.housingAdequacy ?? 0).toBeGreaterThan(
      lowHousing.traces.at(-1)?.indicators.housingAdequacy ?? 0,
    );
  });

  it('remains stable across multiple contrasting parameter sets', () => {
    const runs = [
      simulateSystemDynamics({ years: 30 }),
      simulateSystemDynamics({
        years: 30,
        policyLevers: {
          housingIncentive: 92,
          economicDevelopment: 90,
          transitInvestment: 45,
          greenProtection: 12,
          compactGrowth: 18,
        },
      }),
      simulateSystemDynamics({
        years: 30,
        policyLevers: {
          housingIncentive: 60,
          economicDevelopment: 58,
          transitInvestment: 92,
          greenProtection: 94,
          compactGrowth: 90,
        },
      }),
      simulateSystemDynamics({
        years: 30,
        initialStocks: {
          ...DEFAULT_SYSTEM_DYNAMICS_STOCKS,
          population: 1_120_000,
          greenSpace: 3_100,
        },
        policyLevers: {
          housingIncentive: 74,
          economicDevelopment: 66,
          transitInvestment: 76,
          greenProtection: 68,
          compactGrowth: 72,
        },
      }),
    ];

    for (const run of runs) {
      expect(run.stability.isStable).toBe(true);
      expect(run.stability.maxAnnualChangeRatio).toBeLessThan(0.25);
      expect(run.traces.every((trace) => Number.isFinite(trace.stocks.population))).toBe(true);
      expect(run.traces.every((trace) => Number.isFinite(trace.stocks.greenSpace))).toBe(true);
    }
  });
});