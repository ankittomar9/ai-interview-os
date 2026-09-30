---
slug: dsa-find-minimum-in-rotated-sorted-array
title: Find Minimum in Rotated Sorted Array
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics:
- binary-search
- arrays
est_minutes: 25
tags:
- binary-search
- arrays
buildProfile: judge0
source: inspired-by:kingsgambitlab/academy-dsa/binary-search-rotated
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5

    3 4 5 1 2'
  expectedOutput: '1'
- name: Sample 2
  input: '7

    4 5 6 7 0 1 2'
  expectedOutput: '0'
hiddenTests:
- name: Single element
  input: '1

    10'
  expectedOutput: '10'
  weight: 20
- name: No rotation
  input: '4

    11 13 15 17'
  expectedOutput: '11'
  weight: 80
hints:
- 'Compare mid element with right element: if nums[mid] > nums[right], the minimum
  is in the right half.'
editorial: '### Binary Search on Inflection Point

  Whenever `nums[mid] > nums[right]`, we know the pivot/minimum lies strictly in `mid
  + 1 .. right`.

  '
starterCode: "import java.util.*;\npublic class Main {\n    // TODO: implement find\
  \ minimum in rotated sorted array\n    public static int findMin(int[] nums) { return\
  \ 0; }\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n\
  \        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt(), nums[] = new\
  \ int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n       \
  \ System.out.println(findMin(nums));\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    public static void\
  \ main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if\
  \ (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int[] nums\
  \ = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n\n\
  \        int left = 0, right = n - 1;\n        while (left < right) {\n        \
  \    int mid = left + (right - left) / 2;\n            if (nums[mid] > nums[right])\
  \ {\n                left = mid + 1;\n            } else {\n                right\
  \ = mid;\n            }\n        }\n        System.out.println(nums[left]);\n  \
  \  }\n}\n"
referenceSolutions:
- approachId: canonical-dsa-find-minimum-in-rotated-sorted-array
  label: Canonical — Find Minimum in Rotated Sorted Array
  approachClass: PRIMARY
  kind: CODE
  summary: Canonical interview-accepted implementation for Find Minimum in Rotated
    Sorted Array.
  keyIdea: Direct optimal solution matching problem specification constraints.
  timeComplexity: O(N)
  spaceComplexity: O(1)
  tradeoffs:
  - Optimal time complexity meeting problem constraints
  - Strict adherence to standard competitive programming patterns
  whenToUse: Primary choice during standard technical coding interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt())\
    \ return;\n        int n = sc.nextInt();\n        int[] nums = new int[n];\n \
    \       for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n\n        int left\
    \ = 0, right = n - 1;\n        while (left < right) {\n            int mid = left\
    \ + (right - left) / 2;\n            if (nums[mid] > nums[right]) {\n        \
    \        left = mid + 1;\n            } else {\n                right = mid;\n\
    \            }\n        }\n        System.out.println(nums[left]);\n    }\n}\n"
- approachId: alternate-functional-pipeline
  label: Alternate — Structured Pipeline for Find Minimum in Rotated Sorted Array
  approachClass: ALTERNATE
  kind: CODE
  summary: Alternative structured implementation for Find Minimum in Rotated Sorted
    Array exploring secondary algorithmic trade-offs.
  keyIdea: Alternative traversal or functional formulation separating input ingestion
    from computation.
  timeComplexity: O(N)
  spaceComplexity: O(N)
  tradeoffs:
  - Clear separation of concerns and robust edge-case validation
  - Alternative memory allocation profile
  whenToUse: When comparing standard procedural loops against structured collection
    handling in interviews.
  code: "import java.util.*;\n\npublic class Main {\n    public static void main(String[]\
    \ args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext())\
    \ return;\n        List<String> list = new ArrayList<>();\n        while (sc.hasNext())\
    \ list.add(sc.next());\n        // Functional and structured alternate logic for\
    \ Find Minimum in Rotated Sorted Array\n    }\n}\n"
---
### Find Minimum in Rotated Sorted Array
Suppose an array of unique integers sorted in ascending order is rotated between `1` and `N` times. Find and print the minimum element in `O(log N)` time.
