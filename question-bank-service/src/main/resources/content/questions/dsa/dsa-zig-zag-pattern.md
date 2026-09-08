---
slug: dsa-zig-zag-pattern
title: Zig-Zag Pattern.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [patterns]
est_minutes: 25
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_131_Zig_Zag_Pattern.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "*     \n  *   *   \n*       *"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "*       *       \n  *   *   *   *   * \n*       *       *"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '*'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "*       * \n  *   *   *   \n*       *"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "*       *       *   \n  *   *   *   *   *   * \n*       *       *"
  weight: 50
hints:
- Analyze the problem using 5. Patterns & Printing (15 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 5. Patterns & Printing (15 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Zig-Zag Pattern.


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printZigZag(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printZigZag(n);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n   \n    public static void printZigZag(int N) {\n        // Step 1: A standard zig-zag wave is traditionally 3 rows tall\n        for (int i = 1; i <= 3; i++) {\n            // Step 2: Loop across N columns\n            for (int j = 1; j <= N; j++) {\n                \n                // Step 3: The Modulo Magic\n                // Condition 1: Downward slopes ((i+j) is a multiple of 4)\n                // Condition 2: Upward slopes (Row 2, and j is a multiple of 4)\n                if (((i + j) % 4 == 0) || (i == 2 && j % 4 == 0)) {\n                    System.out.print(\"* \");\n                } else {\n                    System.out.print(\"  \"); // Two spaces for perfect alignment\n                }\n            }   \n            // Step 4: Drop to the next row of the grid\n            System.out.println();\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n   \
  \     if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printZigZag(n);\n    }\n}\n    \n"
---

### Zig-Zag Pattern.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
