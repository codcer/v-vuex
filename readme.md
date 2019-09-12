### 使用方法

---

1.  安装
    ```shell
    npm install v-vuex
    ```
2.  注入 store
    ```javascript
    import spirits from "v-vuex";
    spirits(store); // 注入全局store
    ```
3.  与 model 进行链接

    ```javascript
    import { connect } from "v-vuex";
    export default connect({
      ns: "demo",
      state: {
        demo: "1242"
      },
      mutations: {
        setDeom(payload) {
          this.demo = payload;
        }
      },
      actions: {
        getDemo(val) {
          this.commit("setDeom", val);
        }
      }
    });
    ```

4.  使用
    ```javascript
    import model from "../../models/test";
    model.getDemo(123);
    ~~~基本介绍;
    ```

---

1. 数据模型（model）概念，用法
   > 说到模块前， 我要先说说使用 vuex 官方的 model（也叫 module）的一些不足首先
   - 官方定义的模块中的方法不能直接使用， 必须配合 dispatch，commit 等方法， 还要拼接 action 字符串（主要是有命名空间的情况下）
   - 官方定义的模块，默认不支持热加载，或者需要写大量模块注入的方法（不方便）
   - 在主流 ide 中， 对自动代码提示不友善， 当用到某个 action 的时候，传参的时候还要查看 action 是怎么定义的
   - 使用的时候不够简洁， 比如还要手动去调用 mapActions/mapGetters..
