declare module "des.js" {
  const des: {
    DES: {
      create(options: {
        type: "encrypt" | "decrypt";
        key: Uint8Array;
        padding: false;
      }): {
        _update(
          input: Uint8Array,
          offset: number,
          output: Uint8Array,
          outOffset: number,
        ): void;
      };
    };
  };
  export default des;
}
