---
slug: dsa-lc21-merge-two-sorted-lists
title: Merge Two Sorted Lists
track: ALGORITHMS_DATA_STRUCTURES
difficulty: EASY
topics: [linked-list, arrays]
est_minutes: 15
tags:
- linked-list
- junior
- lc-21
buildProfile: judge0
source: inspired-by:operator-corpus/Q_59_Merge_Two_Sorted_Lists.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '3

    1 2 4

    3

    1 3 4'
  expectedOutput: 1 1 2 3 4 4
  description: Primary test case
- name: Sample 2
  input: '2

    1 5

    2

    2 6'
  expectedOutput: 1 2 5 6
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1

    0

    1

    0'
  expectedOutput: 0 0
  weight: 25
- name: Hidden 2
  input: '3

    2 4 6

    3

    1 3 5'
  expectedOutput: 1 2 3 4 5 6
  weight: 25
- name: Hidden 3
  input: '2

    10 20

    2

    30 40'
  expectedOutput: 10 20 30 40
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
editorial: '### Merge Two Sorted Lists


  This problem evaluates core techniques in Linked List. Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static ListNode mergeTwoLists(ListNode list1,ListNode list2) {\n        return new ArrayList<>();\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        ListNode dummy1 = new ListNode(0);\n        ListNode cur1 = dummy1;\n        for (int i = 0; i < n1; i++) { cur1.next = new ListNode(sc.nextInt()); cur1 = cur1.next; }\n        int n2 = sc.nextInt();\n        ListNode dummy2 = new ListNode(0);\n        ListNode cur2 = dummy2;\n        for (int i = 0; i < n2; i++) { cur2.next = new ListNode(sc.nextInt()); cur2 = cur2.next; }\n        ListNode res = mergeTwoLists(dummy1.next, dummy2.next);\n        while (res != null) {\n            System.out.print(res.val + (res.next != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n"
solutionCode: "import java.util.*;\n\npublic class Main {\n    \n    public static ListNode mergeTwoLists(ListNode list1,ListNode list2){\n       ListNode dummy=new ListNode(0);\n        ListNode current=dummy;\n\n        while(list1!=null && list2!=null ){\n            if(list1.val<= list2.val){\n                current.next=list1;\n                list1=list1.next;\n            }else{\n                 current.next=list2;\n                list2=list2.next;\n            }   \n            current=current.next;         \n        }\n        if(list1!=null){\n            current.next=list1;\n        }else{\n            current.next=list2;\n        }\n        return dummy.next;\n    }\n    public static String listToString(ListNode head){\n        StringBuilder sb=new StringBuilder();\n        sb.append(\"[\");\n        ListNode temp=head;\n        while(temp!=null){\n            sb.append(temp.val);\n            if(temp.next!=null){\n                sb.append(\",\");\n            }\n      \
  \      temp=temp.next;\n        }\n         sb.append(\"]\");\n        return sb.toString();\n    }\n    public static class ListNode{\n        int val; ListNode next; \n        public ListNode(int val){ this.val=val;        }\n         public ListNode(int val,ListNode next){ this.val=val; this.next=next;}\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n1 = sc.nextInt();\n        ListNode dummy1 = new ListNode(0);\n        ListNode cur1 = dummy1;\n        for (int i = 0; i < n1; i++) { cur1.next = new ListNode(sc.nextInt()); cur1 = cur1.next; }\n        int n2 = sc.nextInt();\n        ListNode dummy2 = new ListNode(0);\n        ListNode cur2 = dummy2;\n        for (int i = 0; i < n2; i++) { cur2.next = new ListNode(sc.nextInt()); cur2 = cur2.next; }\n        ListNode res = mergeTwoLists(dummy1.next, dummy2.next);\n        while (res != null) {\n            System.out.print(res.val + (res.next\
  \ != null ? \" \" : \"\"));\n            res = res.next;\n        }\n        System.out.println();\n    }\n}\n "
---

### Merge Two Sorted Lists

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
