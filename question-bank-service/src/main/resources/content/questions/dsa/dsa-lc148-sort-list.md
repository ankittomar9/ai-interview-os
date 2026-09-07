---
slug: dsa-lc148-sort-list
title: Sort List
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [linked-list, arrays]
est_minutes: 25
tags:
- linked-list
- mid
- lc-148
buildProfile: judge0
source: inspired-by:operator-corpus/Q_109_Sort_List.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '4

    1 2 3 4'
  expectedOutput: 1 2 3 4
  description: Primary test case
- name: Sample 2
  input: '5

    10 20 30 40 50'
  expectedOutput: 10 20 30 40 50
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    42'
  expectedOutput: '42'
  weight: 25
- name: Hidden 2
  input: '3

    5 1 9'
  expectedOutput: 1 5 9
  weight: 25
- name: Hidden 3
  input: '4

    1 2 2 1'
  expectedOutput: 1 1 2 2
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
editorial: '### Sort List


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static ListNode sortList(ListNode head) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n        ListNode head = dummy.next;\n        ListNode res = sortList(head);\n        while (res != null) {\n            System.out.print(res.val + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static ListNode sortList(ListNode head){\n        if(head==null || head.next==null){ return head;}\n\n        ListNode slow=head;\n        ListNode fast=head;\n        ListNode prev=null;\n        while(fast!=null && fast.next!=null){\n            prev=slow;\n            slow=slow.next;\n            fast=fast.next.next;\n        }\n        prev.next=null;\n\n        ListNode left=sortList(head);\n        ListNode right=sortList(slow);\n        return merge(left,right);\n    }\n    public static ListNode merge(ListNode l1,ListNode l2){\n        ListNode dummy =new ListNode();\n        ListNode tail=dummy;\n        while(l1!=null && l2!=null){\n            if(l1.val <l2.val){\n                tail.next=l1;\n                l1=l1.next;\n            }else{\n                tail.next=l2;\n                l2=l2.next;\n            }\n            tail=tail.next;\n        }\n        if(l1!=null ){\n            tail.next=l1;\n\
  \        }else{\n            tail.next=l2;\n        }\n        return dummy.next;\n    }\n   \n    public static class ListNode{\n        int val;ListNode next;ListNode(){}\n        ListNode(int val){this.val=val;}\n        ListNode(int val,ListNode next){this.val=val;this.next=next;}\n    }\n   \n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        ListNode dummy = new ListNode(0);\n        ListNode cur = dummy;\n        for (int i = 0; i < n; i++) { cur.next = new ListNode(sc.nextInt()); cur = cur.next; }\n        ListNode head = dummy.next;\n        ListNode res = sortList(head);\n        while (res != null) {\n            System.out.print(res.val + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}"
---

### Sort List

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
