---
slug: dsa-lc141-linked-list-cycle
title: Linked List Cycle
track: ALGORITHMS_DATA_STRUCTURES
difficulty: JUNIOR
tags:
- linked-list
- junior
- lc-141
buildProfile: judge0
source: inspired-by:operator-corpus/Q_57_Linked_List_Cycle_1.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    1 2 3 4'
  expectedOutput: 'false'
  description: Primary test case
- name: Sample 2
  input: '5

    10 20 30 40 50'
  expectedOutput: 'false'
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    42'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 2
  input: '3

    5 1 9'
  expectedOutput: 'false'
  weight: 25
- name: Hidden 3
  input: '4

    1 2 2 1'
  expectedOutput: 'false'
  weight: 50
hints:
- Analyze the problem using Linked List algorithmic patterns.
- Consider space and time complexity trade-offs to reach optimal efficiency.
constraints:
- 1 <= N <= 10^5
- -10^9 <= value <= 10^9
coaching:
  presentationTips:
  - Clarify input constraints and potential edge cases upfront.
  - Explain the algorithmic approach clearly before jumping into code.
  approachHint: Utilize standard Linked List techniques to solve the problem efficiently.
  commonMistakes:
  - Failing to handle boundary conditions (empty input, single element).
  - Integer overflow when computing sums, products, or powers.
  modelAnswerOutline: '1. Understand problem constraints

    2. Outline optimal approach

    3. Implement clean solution

    4. Analyze complexity'
editorial: '### Linked List Cycle


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static boolean hasCycle(ListNode head) {\n        return false;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n        ListNode head = dummy.next;\n        System.out.println(hasCycle(head));\n    }\n}\n"
solutionCode: "import java.util.*;\nimport java.util.HashSet;\npublic class Main {\n     \n    public static boolean hasCycle(ListNode head){\n        if (head == null || head.next == null) {\n            return false;\n        }\n        ListNode slow = head;\n        ListNode fast = head;\n\n        while (fast != null && fast.next != null) {\n            slow = slow.next;\n            fast = fast.next.next;\n\n            if (slow == fast) {\n                return true;\n            }\n        }\n        return false;\n    }\n    // The upgraded, crash-proof print method\n    public static String listToString(ListNode head){\n        StringBuilder sb = new StringBuilder();\n        sb.append(\"[\");\n        ListNode temp = head;\n        // A set to remember the exact nodes (memory addresses) we have already seen\n        HashSet<ListNode> visited = new HashSet<>();\n        while (temp != null) {\n            // If the set already contains this node, we've looped!\n            if (visited.contains(temp))\
  \ {\n                sb.append(\"... (Cycle back to node with val: \").append(temp.val).append(\")\");\n                break; // Break the infinite loop!\n            }\n            // Remember this node for the future\n            visited.add(temp);\n            sb.append(temp.val);\n            if (temp.next != null) {\n                sb.append(\", \");\n            }\n            temp = temp.next;\n        }\n        sb.append(\"]\");\n        return sb.toString();\n    }\n\n    public static class ListNode{\n        int val;\n        ListNode next;\n\n        ListNode(int x) {\n            this.val = x;\n            this.next = null;\n        }\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n \
  \       ListNode head = dummy.next;\n        System.out.println(hasCycle(head));\n    }\n}"
---

### Linked List Cycle

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
