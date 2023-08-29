import { useCallback, useState } from "react";
import { FieldValues, UseFormReturn } from "react-hook-form";
import { IoMdImage } from "react-icons/io";

interface InputProps {
  name: string;
  files?: File[] | null;
  form: UseFormReturn<FieldValues, any, undefined>;
  multiple?: boolean;
  // onUpload: (file: File) => void;
}

export const ImageUpload: React.FC<InputProps> = ({
  name,
  files,
  form,
  multiple,
}) => {
  const [imageLogo, setImageLogo] = useState<File>();
  const [createObjectURL, setCreateObjectURL] = useState<string>("");

  const uploadToClientLogo = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      // eslint-disable-next-line @typescript-eslint/prefer-optional-chain
      if (event.target.files && event.target.files[0]) {
        const i = event.target.files[0];

        setImageLogo(i);

        let url = URL.createObjectURL(i);
        setCreateObjectURL(url);
      }
    },
    [form, setImageLogo, setCreateObjectURL],
  );

  // set default values
  // useEffect(() => {
  //   setCreateObjectURL(url!);
  //   // reset form
  //   // setTimeout is needed to prevent the form from being reset before the default values are set
  //   // setTimeout(() => {
  //   //   reset({
  //   //     ...organisation,
  //   //   });
  //   // }, 100);
  // }, [setCreateObjectURL, url]);
  return (
    <>
      <div className="flex items-center justify-center pb-4">
        {/* NO IMAGE */}
        {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing */}
        {!(files || createObjectURL) && (
          <IoMdImage className="h-12 w-12 rounded-lg" />
        )}
        {/* EXISTING IMAGE */}
        {/* {!createObjectURL && files && ( */}
        files: {JSON.stringify(files)}
        {files && (
          <>
            {files.map((file) => {
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  className="rounded-lg"
                  alt="company logo"
                  width={150}
                  height={150}
                  src={file.name}
                  key={file.name}
                />
              </>;
            })}
          </>
        )}
        {/* UPLOADED IMAGE */}
        {createObjectURL && (
          <>
            {/* eslint-disable */}
            <img
              className="rounded-lg shadow-lg"
              alt="user logo"
              width={75}
              height={75}
              src={createObjectURL}
            />
            {/* eslint-enable */}
          </>
        )}
      </div>

      <input
        type="file"
        className="file-input file-input-bordered file-input-primary file-input-sm w-full"
        {...form.register(name)}
        onChange={uploadToClientLogo}
        multiple={multiple}
      />
    </>
  );
};
