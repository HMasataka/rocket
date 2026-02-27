import { OperationPreview } from "../../../components/organisms/OperationPreview";
import type { CommitDetail } from "../../../services/history";

interface ResetPreviewProps {
  detail: CommitDetail | null;
}

export function ResetPreview({ detail }: ResetPreviewProps) {
  return <OperationPreview detail={detail} hashClassName="danger" />;
}
