---
slug: dsa-check-if-two-strings-are-rotation-of-each-other
title: Check if two strings are Rotation of each other.
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [strings]
est_minutes: 25
tags:
- 3-strings-the-tricky-part--35-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_86_All_Substrings.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: hello
  expectedOutput: 'h

    he

    hel

    hell

    hello

    e

    el

    ell

    ello

    l

    ll

    llo

    l

    lo

    o'
  description: Primary test case
- name: Sample 2
  input: racecar
  expectedOutput: 'r

    ra

    rac

    race

    racec

    raceca

    racecar

    a

    ac

    ace

    acec

    aceca

    acecar

    c

    ce

    cec

    ceca

    cecar

    e

    ec

    eca

    ecar

    c

    ca

    car

    a

    ar

    r'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: algorithm
  expectedOutput: 'a

    al

    alg

    algo

    algor

    algori

    algorit

    algorith

    algorithm

    l

    lg

    lgo

    lgor

    lgori

    lgorit

    lgorith

    lgorithm

    g

    go

    gor

    gori

    gorit

    gorith

    gorithm

    o

    or

    ori

    orit

    orith

    orithm

    r

    ri

    rit

    rith

    rithm

    i

    it

    ith

    ithm

    t

    th

    thm

    h

    hm

    m'
  weight: 25
- name: Hidden 2
  input: noon
  expectedOutput: 'n

    no

    noo

    noon

    o

    oo

    oon

    o

    on

    n'
  weight: 25
- name: Hidden 3
  input: interview
  expectedOutput: 'i

    in

    int

    inte

    inter

    interv

    intervi

    intervie

    interview

    n

    nt

    nte

    nter

    nterv

    ntervi

    ntervie

    nterview

    t

    te

    ter

    terv

    tervi

    tervie

    terview

    e

    er

    erv

    ervi

    ervie

    erview

    r

    rv

    rvi

    rvie

    rview

    v

    vi

    vie

    view

    i

    ie

    iew

    e

    ew

    w'
  weight: 50
hints:
- Analyze the problem using 3. Strings (The "Tricky" Part - 35 Questions) algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard 3. Strings (The "Tricky" Part - 35 Questions) techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Check if two strings are Rotation of each other.


  This problem evaluates core techniques in 3. Strings (The "Tricky" Part - 35 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printSubstring(String str) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        printSubstring(s);\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static void printSubstring(String str){\n        if(str==null ||str.isEmpty()) return;\n        int n=str.length();\n\n        for(int i=0;i<n;i++){\n            for(int j=i+1;j<=n;j++){\n                String sub=str.substring(i,j);\n                System.out.println(sub);\n            }\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        String s = sc.next();\n        printSubstring(s);\n    }\n}"
---

### Check if two strings are Rotation of each other.

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
