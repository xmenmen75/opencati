# Card Pack Opening Simulation Report

## Simulation Parameters

- **Players**: Alice, Bob, Charlie
- **Initial CATI Balance**: 2500 CATI per player
- **Pack Cost**: 500 CATI
- **Plays per Player**: 5
- **Sponsor Pool**: 100000 CATI
- **Total Events**: 15

## Card Probabilities & Pool Shares

### SS Rank

- **Probability per Card**: 0.1%
- **Pool Share per Card**: 70%
- **Cards**: Legendary Dragon

### S Rank

- **Probability per Card**: 2.0%
- **Pool Share per Card**: 12%
- **Cards**: Mystic Phoenix, Thunder Wolf

### AA Rank

- **Probability per Card**: 6.0%
- **Pool Share per Card**: 10%
- **Cards**: Crystal Guardian, Shadow Knight, Fire Sprite

### A Rank

- **Probability per Card**: 30.0%
- **Pool Share per Card**: 4%
- **Cards**: Wind Archer, Earth Golem, Water Mage, Lightning Cat

## Event-by-Event State Table

| Index | Player | Pool Amount | Won Card | Card Pool Share | Alice Total | Bob Total | Charlie Total |
|-------|--------|-------------|----------|-----------------|-------------|-----------|---------------|
| 1 | Alice | 100500 | No | 0% | 0 | 0 | 0 |
| 2 | Bob | 101000 | No | 0% | 0 | 0 | 0 |
| 3 | Charlie | 101500 | No | 0% | 0 | 0 | 0 |
| 4 | Alice | 102000 | A - Lightning Cat | 4% | 4020 | 0 | 0 |
| 5 | Bob | 102500 | No | 0% | 4020 | 0 | 0 |
| 6 | Charlie | 103000 | No | 0% | 4020 | 0 | 0 |
| 7 | Alice | 103500 | No | 0% | 4020 | 0 | 0 |
| 8 | Bob | 104000 | No | 0% | 4020 | 0 | 0 |
| 9 | Charlie | 104500 | No | 0% | 4020 | 0 | 0 |
| 10 | Alice | 105000 | A - Water Mage | 4% | 4040 | 0 | 0 |
| 11 | Bob | 105500 | AA - Fire Sprite | 10% | 4060 | 10150 | 0 |
| 12 | Charlie | 106000 | No | 0% | 4060 | 10150 | 0 |
| 13 | Alice | 106500 | A - Water Mage | 4% | 4080 | 10200 | 0 |
| 14 | Bob | 107000 | A - Earth Golem | 4% | 3075 | 11275 | 0 |
| 15 | Charlie | 107500 | No | 0% | 3075 | 11275 | 0 |


## Final Summary

### Alice

- **Final CATI Balance**: 0 CATI
- **Total CATI Spent**: 2500 CATI
- **Total Reward**: 3075 CATI
- **Net Result**: +575 CATI
- **Cards Won**: 3/5 (60.0% success rate)
- **Cards Obtained**:

  1. A - Lightning Cat (4% pool share)
  2. A - Water Mage (4% pool share)
  3. A - Water Mage (4% pool share)


### Bob

- **Final CATI Balance**: 0 CATI
- **Total CATI Spent**: 2500 CATI
- **Total Reward**: 11275 CATI
- **Net Result**: +8775 CATI
- **Cards Won**: 2/5 (40.0% success rate)
- **Cards Obtained**:

  1. AA - Fire Sprite (10% pool share)
  2. A - Earth Golem (4% pool share)


### Charlie

- **Final CATI Balance**: 0 CATI
- **Total CATI Spent**: 2500 CATI
- **Total Reward**: 0 CATI
- **Net Result**: -2500 CATI
- **Cards Won**: 0/5 (0.0% success rate)


## Overall Statistics

- **Total CATI Spent by All Players**: 7500 CATI
- **Player Contributions to Pool**: 7500 CATI
- **Sponsor Pool**: 100000 CATI
- **Total Reward Pool**: 107500 CATI
- **Total Cards Won**: 5/15 attempts
- **Overall Success Rate**: 33.3%
- **Total Rewards Distributed**: 14350 CATI

## Card Distribution

- **A - Water Mage**: 2 copies
- **A - Lightning Cat**: 1 copies
- **AA - Fire Sprite**: 1 copies
- **A - Earth Golem**: 1 copies
