---
slug: dsa-print-all-prime-numbers-in-a-given-range
title: Print all Prime Numbers in a given range.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- 1-basic-numbers--math-the-warm-up--25-questions
- junior
buildProfile: judge0
source: inspired-by:operator-corpus/Q_2_Print_Prime_Optimized.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: 'Primes up to 5: [2, 3, 5]'
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: 'Primes up to 10: [2, 3, 5, 7]'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: No primes up to 1
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: 'Primes up to 7: [2, 3, 5, 7]'
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: 'Primes up to 12: [2, 3, 5, 7, 11]'
  weight: 50
hints:
- Analyze the problem using 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 1. Basic Numbers & Math (The "Warm Up" - 25 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Print all Prime Numbers in a given range.


  This problem evaluates core techniques in 1. Basic Numbers & Math (The "Warm Up" - 25 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printPrimeSieve(int n) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printPrimeSieve(n);\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.ArrayList;\nimport java.util.Arrays;\nimport java.util.List;\npublic class Main {\n    \n         public static void printPrimeSieve(int n){\n            if (n < 2) {\n        System.out.println(\"No primes up to \" + n);\n        return;\n    }\n            boolean[] isPrime=new boolean[n+1];\n            Arrays.fill(isPrime, true);\n            isPrime[0]=false;\n            isPrime[1]=false;\n\n            for(int p=2;p*p<=n;p++){          \n                if(isPrime[p]==true){\n                    for(int i=p*p;i<=n;i=i+p){\n                        isPrime[i]=false;\n                    }\n                }\n            }\n            List<Integer> primeNumbers=new ArrayList<>();\n            for(int i=2;i<=n;i++){\n                if(isPrime[i]==true){\n                    primeNumbers.add(i);\n                }\n            }\n            System.out.println(\"Primes up to \" + n + \": \" + primeNumbers);\n         }    \n\n    public\
  \ static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printPrimeSieve(n);\n    }\n}\n\n/*TC : O(n) Sieve of Eras\n    SC: O(n) */"
---

### Print all Prime Numbers in a given range.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
