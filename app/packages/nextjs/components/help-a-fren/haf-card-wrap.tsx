interface Props {
  children: React.ReactNode;
}

const HafCardWrap = ({ children }: Props) => {
  return (
    <div className="wrapper p-md justify-center" data-theme="exampleUi">
      <div className="container grid gap-6 max-w-screen-xl">{children}</div>
    </div>
  );
};

export default HafCardWrap;
