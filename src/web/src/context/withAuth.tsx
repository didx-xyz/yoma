import { type NextPage } from "next";
import { AccessDenied } from "~/components/Status/AccessDenied";
import { Unauthorized } from "~/components/Status/Unauthorized";
import { type NextPageWithLayout } from "~/pages/_app";

const withAuth = <P extends object>(
  WrappedComponent: NextPageWithLayout<P>,
): NextPage<P> => {
  const HOC = (props: P) => {
    let componentToRender = null;
    const user = (props as any).user; // eslint-disable-line

    // check authenticated user (passed in as props to wrapped component)
    if (!user) componentToRender = <Unauthorized />;
    // check required role
    // eslint-disable-next-line
    else if (user.roles.indexOf("User") == -1)
      componentToRender = <AccessDenied />;
    // else render the wrapped component
    else componentToRender = <WrappedComponent {...props} />;

    const getLayout = WrappedComponent.getLayout ?? ((page) => page);
    const Layout = getLayout(componentToRender);

    return Layout;
  };
  return HOC;
};

export default withAuth;
