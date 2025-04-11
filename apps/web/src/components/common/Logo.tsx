import Image from "next/image";
import Link from "next/link";
import React from "react";

interface Props {
  isMobile?: boolean;
  width?: number;
  height?: number;
}

const Logo = ({ isMobile, width = 120, height = 64 }: Props) => {
  return (
    <Link href={"/"}>
      <div className="flex gap-2 items-center">
        <Image
          src={"/images/logo.png"}
          width={width}
          height={height}
          alt="logo"
        />
      </div>
    </Link>
  );
};

export default Logo;
