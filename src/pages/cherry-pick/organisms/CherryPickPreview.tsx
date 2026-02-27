import { OperationPreview } from "../../../components/organisms/OperationPreview";
import type { CommitDetail } from "../../../services/history";

interface CherryPickPreviewProps {
  detail: CommitDetail | null;
}

export function CherryPickPreview({ detail }: CherryPickPreviewProps) {
  return <OperationPreview detail={detail} hashClassName="cherry" />;
}
