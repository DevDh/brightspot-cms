package com.psddev.cms.db;

import java.util.Collection;

import com.psddev.cms.tool.TaxonSearchResultRenderer;
import com.psddev.dari.db.Modification;
import com.psddev.dari.db.Query;
import com.psddev.dari.db.Recordable;
import com.psddev.dari.util.PaginatedResult;

@ToolUi.SearchResultRenderer(TaxonSearchResultRenderer.class)
public interface Taxon extends Recordable {

    public boolean isRoot();

    public Collection<? extends Taxon> getChildren();

    public static final class TaxonModification extends Modification<Taxon> {

        private TaxonModification(){
        }

        @Indexed
        @ToolUi.Hidden
        private Boolean root;

        public Boolean isRoot() {
            return Boolean.TRUE.equals(root);
        }

        public void setRoot(Boolean root) {
            this.root = root ? Boolean.TRUE : null;
        }

        public void beforeSave(){
            this.setRoot(this.getOriginalObject().isRoot());
        }
    }

    /** {@link Taxon} utility methods. */
    public static final class Static {

        public static <T extends Taxon> PaginatedResult<T> getRoots(Class<T> taxonClass, long offset, int limit) {
            return Query.from(taxonClass).where("root = true").select(offset, limit);
        }
    }
}
