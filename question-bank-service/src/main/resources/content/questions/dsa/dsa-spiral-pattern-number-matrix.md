---
slug: dsa-spiral-pattern-number-matrix
title: Spiral Pattern (Number Matrix).
track: ALGORITHMS_DATA_STRUCTURES
difficulty: MEDIUM
topics: [matrix]
est_minutes: 25
tags:
- 5-patterns--printing-15-questions
- mid
buildProfile: judge0
source: inspired-by:operator-corpus/Q_130_Spiral_Pattern.java
status: PUBLISHED
sampleTests:
- name: Sample 1
  input: '5'
  expectedOutput: "1\t2\t3\t4\t5\t\n16\t0\t0\t0\t6\t\n15\t0\t0\t0\t7\t\n14\t0\t0\t0\t8\t\n13\t12\t11\t10\t9\t\n1\t2\t3\t4\t5\t\n16\t17\t18\t19\t6\t\n15\t24\t0\t20\t7\t\n14\t23\t22\t21\t8\t\n13\t12\t11\t10\t9\t\n1\t2\t3\t4\t5\t\n16\t17\t18\t19\t6\t\n15\t24\t25\t20\t7\t\n14\t23\t22\t21\t8\t\n13\t12\t11\t10\t9"
  description: Primary test case
- name: Sample 2
  input: '10'
  expectedOutput: "1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n36\t0\t0\t0\t0\t0\t0\t0\t0\t11\t\n35\t0\t0\t0\t0\t0\t0\t0\t0\t12\t\n34\t0\t0\t0\t0\t0\t0\t0\t0\t13\t\n33\t0\t0\t0\t0\t0\t0\t0\t0\t14\t\n32\t0\t0\t0\t0\t0\t0\t0\t0\t15\t\n31\t0\t0\t0\t0\t0\t0\t0\t0\t16\t\n30\t0\t0\t0\t0\t0\t0\t0\t0\t17\t\n29\t0\t0\t0\t0\t0\t0\t0\t0\t18\t\n28\t27\t26\t25\t24\t23\t22\t21\t20\t19\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n36\t37\t38\t39\t40\t41\t42\t43\t44\t11\t\n35\t64\t0\t0\t0\t0\t0\t0\t45\t12\t\n34\t63\t0\t0\t0\t0\t0\t0\t46\t13\t\n33\t62\t0\t0\t0\t0\t0\t0\t47\t14\t\n32\t61\t0\t0\t0\t0\t0\t0\t48\t15\t\n31\t60\t0\t0\t0\t0\t0\t0\t49\t16\t\n30\t59\t0\t0\t0\t0\t0\t0\t50\t17\t\n29\t58\t57\t56\t55\t54\t53\t52\t51\t18\t\n28\t27\t26\t25\t24\t23\t22\t21\t20\t19\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n36\t37\t38\t39\t40\t41\t42\t43\t44\t11\t\n35\t64\t65\t66\t67\t68\t69\t70\t45\t12\t\n34\t63\t84\t0\t0\t0\t0\t71\t46\t13\t\n33\t62\t83\t0\t0\t0\t0\t72\t47\t14\t\n32\t61\t82\t0\t0\t0\t0\t73\t48\t15\t\n31\t60\t81\t0\t0\t0\t0\t74\t49\t\
    16\t\n30\t59\t80\t79\t78\t77\t76\t75\t50\t17\t\n29\t58\t57\t56\t55\t54\t53\t52\t51\t18\t\n28\t27\t26\t25\t24\t23\t22\t21\t20\t19\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n36\t37\t38\t39\t40\t41\t42\t43\t44\t11\t\n35\t64\t65\t66\t67\t68\t69\t70\t45\t12\t\n34\t63\t84\t85\t86\t87\t88\t71\t46\t13\t\n33\t62\t83\t96\t0\t0\t89\t72\t47\t14\t\n32\t61\t82\t95\t0\t0\t90\t73\t48\t15\t\n31\t60\t81\t94\t93\t92\t91\t74\t49\t16\t\n30\t59\t80\t79\t78\t77\t76\t75\t50\t17\t\n29\t58\t57\t56\t55\t54\t53\t52\t51\t18\t\n28\t27\t26\t25\t24\t23\t22\t21\t20\t19\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t\n36\t37\t38\t39\t40\t41\t42\t43\t44\t11\t\n35\t64\t65\t66\t67\t68\t69\t70\t45\t12\t\n34\t63\t84\t85\t86\t87\t88\t71\t46\t13\t\n33\t62\t83\t96\t97\t98\t89\t72\t47\t14\t\n32\t61\t82\t95\t100\t99\t90\t73\t48\t15\t\n31\t60\t81\t94\t93\t92\t91\t74\t49\t16\t\n30\t59\t80\t79\t78\t77\t76\t75\t50\t17\t\n29\t58\t57\t56\t55\t54\t53\t52\t51\t18\t\n28\t27\t26\t25\t24\t23\t22\t21\t20\t19"
  description: Secondary boundary test case
hiddenTests:
- name: Hidden 1
  input: '1'
  expectedOutput: '1'
  weight: 25
- name: Hidden 2
  input: '7'
  expectedOutput: "1\t2\t3\t4\t5\t6\t7\t\n24\t0\t0\t0\t0\t0\t8\t\n23\t0\t0\t0\t0\t0\t9\t\n22\t0\t0\t0\t0\t0\t10\t\n21\t0\t0\t0\t0\t0\t11\t\n20\t0\t0\t0\t0\t0\t12\t\n19\t18\t17\t16\t15\t14\t13\t\n1\t2\t3\t4\t5\t6\t7\t\n24\t25\t26\t27\t28\t29\t8\t\n23\t40\t0\t0\t0\t30\t9\t\n22\t39\t0\t0\t0\t31\t10\t\n21\t38\t0\t0\t0\t32\t11\t\n20\t37\t36\t35\t34\t33\t12\t\n19\t18\t17\t16\t15\t14\t13\t\n1\t2\t3\t4\t5\t6\t7\t\n24\t25\t26\t27\t28\t29\t8\t\n23\t40\t41\t42\t43\t30\t9\t\n22\t39\t48\t0\t44\t31\t10\t\n21\t38\t47\t46\t45\t32\t11\t\n20\t37\t36\t35\t34\t33\t12\t\n19\t18\t17\t16\t15\t14\t13\t\n1\t2\t3\t4\t5\t6\t7\t\n24\t25\t26\t27\t28\t29\t8\t\n23\t40\t41\t42\t43\t30\t9\t\n22\t39\t48\t49\t44\t31\t10\t\n21\t38\t47\t46\t45\t32\t11\t\n20\t37\t36\t35\t34\t33\t12\t\n19\t18\t17\t16\t15\t14\t13"
  weight: 25
- name: Hidden 3
  input: '12'
  expectedOutput: "1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t13\t\n43\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t14\t\n42\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t15\t\n41\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t16\t\n40\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t17\t\n39\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t18\t\n38\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t19\t\n37\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t20\t\n36\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t21\t\n35\t0\t0\t0\t0\t0\t0\t0\t0\t0\t0\t22\t\n34\t33\t32\t31\t30\t29\t28\t27\t26\t25\t24\t23\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t45\t46\t47\t48\t49\t50\t51\t52\t53\t54\t13\t\n43\t80\t0\t0\t0\t0\t0\t0\t0\t0\t55\t14\t\n42\t79\t0\t0\t0\t0\t0\t0\t0\t0\t56\t15\t\n41\t78\t0\t0\t0\t0\t0\t0\t0\t0\t57\t16\t\n40\t77\t0\t0\t0\t0\t0\t0\t0\t0\t58\t17\t\n39\t76\t0\t0\t0\t0\t0\t0\t0\t0\t59\t18\t\n38\t75\t0\t0\t0\t0\t0\t0\t0\t0\t60\t19\t\n37\t74\t0\t0\t0\t0\t0\t0\t0\t0\t61\t20\t\n36\t73\t0\t0\t0\t0\t0\t0\t0\t0\t62\t21\t\n35\t72\t71\t70\t69\t68\t67\t66\t65\t64\t63\t22\t\n34\t33\t32\t31\t\
    30\t29\t28\t27\t26\t25\t24\t23\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t45\t46\t47\t48\t49\t50\t51\t52\t53\t54\t13\t\n43\t80\t81\t82\t83\t84\t85\t86\t87\t88\t55\t14\t\n42\t79\t108\t0\t0\t0\t0\t0\t0\t89\t56\t15\t\n41\t78\t107\t0\t0\t0\t0\t0\t0\t90\t57\t16\t\n40\t77\t106\t0\t0\t0\t0\t0\t0\t91\t58\t17\t\n39\t76\t105\t0\t0\t0\t0\t0\t0\t92\t59\t18\t\n38\t75\t104\t0\t0\t0\t0\t0\t0\t93\t60\t19\t\n37\t74\t103\t0\t0\t0\t0\t0\t0\t94\t61\t20\t\n36\t73\t102\t101\t100\t99\t98\t97\t96\t95\t62\t21\t\n35\t72\t71\t70\t69\t68\t67\t66\t65\t64\t63\t22\t\n34\t33\t32\t31\t30\t29\t28\t27\t26\t25\t24\t23\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t45\t46\t47\t48\t49\t50\t51\t52\t53\t54\t13\t\n43\t80\t81\t82\t83\t84\t85\t86\t87\t88\t55\t14\t\n42\t79\t108\t109\t110\t111\t112\t113\t114\t89\t56\t15\t\n41\t78\t107\t128\t0\t0\t0\t0\t115\t90\t57\t16\t\n40\t77\t106\t127\t0\t0\t0\t0\t116\t91\t58\t17\t\n39\t76\t105\t126\t0\t0\t0\t0\t117\t92\t59\t18\t\n38\t75\t104\t125\t0\t0\t0\t0\t118\t93\t60\t19\t\n37\t74\t\
    103\t124\t123\t122\t121\t120\t119\t94\t61\t20\t\n36\t73\t102\t101\t100\t99\t98\t97\t96\t95\t62\t21\t\n35\t72\t71\t70\t69\t68\t67\t66\t65\t64\t63\t22\t\n34\t33\t32\t31\t30\t29\t28\t27\t26\t25\t24\t23\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t45\t46\t47\t48\t49\t50\t51\t52\t53\t54\t13\t\n43\t80\t81\t82\t83\t84\t85\t86\t87\t88\t55\t14\t\n42\t79\t108\t109\t110\t111\t112\t113\t114\t89\t56\t15\t\n41\t78\t107\t128\t129\t130\t131\t132\t115\t90\t57\t16\t\n40\t77\t106\t127\t140\t0\t0\t133\t116\t91\t58\t17\t\n39\t76\t105\t126\t139\t0\t0\t134\t117\t92\t59\t18\t\n38\t75\t104\t125\t138\t137\t136\t135\t118\t93\t60\t19\t\n37\t74\t103\t124\t123\t122\t121\t120\t119\t94\t61\t20\t\n36\t73\t102\t101\t100\t99\t98\t97\t96\t95\t62\t21\t\n35\t72\t71\t70\t69\t68\t67\t66\t65\t64\t63\t22\t\n34\t33\t32\t31\t30\t29\t28\t27\t26\t25\t24\t23\t\n1\t2\t3\t4\t5\t6\t7\t8\t9\t10\t11\t12\t\n44\t45\t46\t47\t48\t49\t50\t51\t52\t53\t54\t13\t\n43\t80\t81\t82\t83\t84\t85\t86\t87\t88\t55\t14\t\n42\t79\t108\t109\t110\t111\t\
    112\t113\t114\t89\t56\t15\t\n41\t78\t107\t128\t129\t130\t131\t132\t115\t90\t57\t16\t\n40\t77\t106\t127\t140\t141\t142\t133\t116\t91\t58\t17\t\n39\t76\t105\t126\t139\t144\t143\t134\t117\t92\t59\t18\t\n38\t75\t104\t125\t138\t137\t136\t135\t118\t93\t60\t19\t\n37\t74\t103\t124\t123\t122\t121\t120\t119\t94\t61\t20\t\n36\t73\t102\t101\t100\t99\t98\t97\t96\t95\t62\t21\t\n35\t72\t71\t70\t69\t68\t67\t66\t65\t64\t63\t22\t\n34\t33\t32\t31\t30\t29\t28\t27\t26\t25\t24\t23"
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
editorial: '### Spiral Pattern (Number Matrix).


  This problem evaluates core techniques in 5. Patterns & Printing (15 Questions). Implement an optimal algorithm ensuring correct boundary handling.


  - **Time Complexity:** O(N) or O(N log N) depending on the core operation.

  - **Space Complexity:** O(1) or O(N) auxiliary space.'
starterCode: "import java.util.*;\n\npublic class Main {\n    public static void printSpiral(int N) {\n        // TODO: implement solution\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printSpiral(n);\n    }\n}\n"
solutionCode: "import java.util.*;\npublic class Main {\n    \n    public static void printSpiral(int N){\n        int matrix[][]=new int[N][N];\n        int top=0; int bottom=N-1;int left=0;int right=N-1;\n        int count=1;\n\n        while(top<=bottom && left<=right){\n            //pass 1\n            for(int i=left; i<=right;i++) {\n                matrix[top][i]=count++;\n            }\n            top++;\n            //pass 2\n            for(int i=top;i<=bottom;i++) {\n                matrix[i][right]=count++;\n            }\n            right--;\n            //pass 3\n            if (top<=bottom) {\n                for (int i= right; i>= left; i--) {\n                    matrix[bottom][i] = count++;\n                }\n                bottom--; // Shrink bottom boundary inward\n            }\n\n            //pass 4\n            if (left <= right) {\n                for (int i=bottom; i>=top;i--) {\n                    matrix[i][left]=count++;\n                }\n             \
  \   left++; // Shrink left boundary inward\n            }\n            for (int i = 0; i < N; i++) {\n            for (int j = 0; j < N; j++) {\n                System.out.print(matrix[i][j] + \"\\t\"); // \\t adds clean tab spacing\n            }\n            System.out.println();\n        }\n\n        }\n\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNext()) return;\n        int n = sc.nextInt();\n        printSpiral(n);\n    }\n}"
---

### Spiral Pattern (Number Matrix).

Given the problem inputs, compute the required result according to the problem constraints.

#### Input Format:
- Standard input containing the test parameters.

#### Output Format:
- Standard output printing the computed result.

#### Constraints:
- `1 <= N <= 10^5`
